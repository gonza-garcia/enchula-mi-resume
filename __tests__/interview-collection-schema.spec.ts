import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  interviewCollectionSchema,
  type InterviewCollection
} from '../src/schemas/interview-collection';
import {
  assertCollectionQuestionIds,
  loadCollections,
  missingCollectionQuestionIds
} from '../src/lib/interview-collection';

const GENERIC_SLUG = 'event-loop-y-asincronia';

function collectionFixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug: 'demo-collection',
    title: { en: 'Demo collection', es: 'Colección demo' },
    items: [
      {
        id: 'item-one',
        note: { en: 'Practice note', es: 'Nota de práctica' },
        questionIds: ['q1', 'q2']
      },
      { id: 'item-two', note: null, questionIds: ['q3'] }
    ],
    ...overrides
  };
}

function issuesOf(result: ReturnType<typeof interviewCollectionSchema.safeParse>): string[] {
  if (result.success) return [];
  return result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

function bankQuestionIds(): Set<string> {
  const dir = path.resolve('src', 'content', 'interview-questions');
  const ids = new Set<string>();
  for (const entry of fs.readdirSync(dir)) {
    if (!entry.endsWith('.json') || entry.endsWith('.quiz.json')) continue;
    const bank = JSON.parse(fs.readFileSync(path.join(dir, entry), 'utf8'));
    for (const question of bank.questions) ids.add(question.id);
  }
  return ids;
}

function readGenericCollection(slug: string): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.resolve('src', 'content', 'collections', `${slug}.json`), 'utf8')
  );
}

function withOffersSource<T>(source: 'demo' | 'local', run: () => T): T {
  const previous = process.env.OFFERS_SOURCE;
  process.env.OFFERS_SOURCE = source;
  try {
    return run();
  } finally {
    if (previous === undefined) delete process.env.OFFERS_SOURCE;
    else process.env.OFFERS_SOURCE = previous;
  }
}

test.describe('Contrato de colecciones de práctica (Fase J)', () => {
  test('la forma válida parsea: note nullable, textos bilingües y items en orden', () => {
    const result = interviewCollectionSchema.safeParse(collectionFixture());
    expect(issuesOf(result)).toEqual([]);
    if (!result.success) return;
    expect(result.data.slug).toBe('demo-collection');
    expect(result.data.items).toHaveLength(2);
    expect(result.data.items[0].note).toEqual({ en: 'Practice note', es: 'Nota de práctica' });
    expect(result.data.items[1].note).toBeNull();
  });

  test('los ids de item duplicados y los questionIds repetidos fallan la validación', () => {
    const duplicatedItem = collectionFixture({
      items: [
        { id: 'item-one', note: null, questionIds: ['q1'] },
        { id: 'item-one', note: null, questionIds: ['q2'] }
      ]
    });
    expect(issuesOf(interviewCollectionSchema.safeParse(duplicatedItem)).join('\n')).toContain(
      'Duplicate item id'
    );

    const duplicatedQuestion = collectionFixture({
      items: [{ id: 'item-one', note: null, questionIds: ['q1', 'q1'] }]
    });
    expect(issuesOf(interviewCollectionSchema.safeParse(duplicatedQuestion)).join('\n')).toContain(
      'Duplicate question id'
    );
  });

  test('la forma inválida falla: sin items, id no kebab, note sin `en` o title incompleto', () => {
    expect(interviewCollectionSchema.safeParse(collectionFixture({ items: [] })).success).toBe(false);
    expect(
      interviewCollectionSchema.safeParse(
        collectionFixture({ items: [{ id: 'Item One', note: null, questionIds: ['q1'] }] })
      ).success
    ).toBe(false);
    expect(
      interviewCollectionSchema.safeParse(
        collectionFixture({
          items: [{ id: 'item-one', note: { en: '', es: 'Nota' }, questionIds: ['q1'] }]
        })
      ).success
    ).toBe(false);
    expect(
      interviewCollectionSchema.safeParse(collectionFixture({ title: { en: 'Solo en' } })).success
    ).toBe(false);
    expect(interviewCollectionSchema.safeParse(collectionFixture({ slug: 'Bad Slug' })).success).toBe(
      false
    );
  });

  test('un questionId inexistente en el banco se reporta y rompe la validación cruzada', () => {
    const broken = interviewCollectionSchema.safeParse(
      collectionFixture({
        items: [{ id: 'item-one', note: null, questionIds: ['not-a-question'] }]
      })
    );
    expect(broken.success).toBe(true);
    if (!broken.success) return;
    expect(missingCollectionQuestionIds(broken.data, bankQuestionIds())).toEqual(['not-a-question']);
    expect(() => assertCollectionQuestionIds([broken.data], bankQuestionIds())).toThrow(
      /unknown question ids: not-a-question/
    );
    expect(() => assertCollectionQuestionIds([broken.data], bankQuestionIds())).toThrow(
      /Collection "demo-collection"/
    );
  });

  test('loadCollections mergea las dos ubicaciones y filtra las personales en build demo', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'collections-'));
    try {
      const genericDir = path.resolve(tmp, 'src', 'content', 'collections');
      fs.mkdirSync(genericDir, { recursive: true });
      fs.writeFileSync(
        path.join(genericDir, 'generic-one.json'),
        JSON.stringify(collectionFixture({ slug: 'generic-one' }))
      );
      for (const [slug, demo, collectionSlug] of [
        ['2026-01-02-oferta-real', false, 'personal-one'],
        ['2026-01-01-oferta-demo', true, 'from-offer']
      ] as const) {
        const dir = path.resolve(tmp, 'docs', 'job-offers', slug);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'offer.md'),
          `---\nempresa: X\nrol: Y\nfecha: 2026-01-01\ndemo: ${demo}\n---\n# Oferta\n`
        );
        fs.writeFileSync(
          path.join(dir, 'collection.json'),
          JSON.stringify(collectionFixture({ slug: collectionSlug }))
        );
      }

      // Build genérico: genericas + la coleccion de la oferta demo. La personal
      // (que puede nombrar empresas reales) queda fuera, igual que su oferta.
      const genericBuild = withOffersSource('demo', () => loadCollections(tmp));
      expect(genericBuild.map((collection) => collection.slug)).toEqual([
        'generic-one',
        'from-offer'
      ]);

      // Dev / build personal: entra todo.
      const localBuild = withOffersSource('local', () => loadCollections(tmp));
      expect(localBuild.map((collection) => collection.slug)).toEqual([
        'generic-one',
        'personal-one',
        'from-offer'
      ]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('el nombre del archivo genérico tiene que ser su slug', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'collections-'));
    try {
      const genericDir = path.resolve(tmp, 'src', 'content', 'collections');
      fs.mkdirSync(genericDir, { recursive: true });
      fs.writeFileSync(
        path.join(genericDir, 'wrong-name.json'),
        JSON.stringify(collectionFixture({ slug: 'generic-one' }))
      );
      expect(() => loadCollections(tmp)).toThrow(/must be named generic-one\.json/);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('las colecciones en disco validan y todos sus questionIds existen en el banco', () => {
    const fixtures: { source: string; raw: Record<string, unknown> }[] = [];
    const genericDir = path.resolve('src', 'content', 'collections');
    for (const entry of fs.readdirSync(genericDir).sort()) {
      if (!entry.endsWith('.json')) continue;
      fixtures.push({
        source: path.posix.join('src/content/collections', entry),
        raw: readGenericCollection(entry.replace(/\.json$/, ''))
      });
    }
    const offersDir = path.resolve('docs', 'job-offers');
    for (const entry of fs.readdirSync(offersDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = path.join(offersDir, entry.name, 'collection.json');
      if (!fs.existsSync(file)) continue;
      fixtures.push({
        source: path.posix.join('docs/job-offers', entry.name, 'collection.json'),
        raw: JSON.parse(fs.readFileSync(file, 'utf8'))
      });
    }
    expect(fixtures.length).toBeGreaterThanOrEqual(1);
    for (const { source, raw } of fixtures) {
      const result = interviewCollectionSchema.safeParse(raw);
      expect(issuesOf(result), source).toEqual([]);
      if (!result.success) continue;
      expect(missingCollectionQuestionIds(result.data, bankQuestionIds()), source).toEqual([]);
    }
  });

  test('conteos: la colección genérica tiene 4 ejercicios y 8 preguntas del banco', () => {
    const result = interviewCollectionSchema.safeParse(readGenericCollection(GENERIC_SLUG));
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.slug).toBe(GENERIC_SLUG);
    expect(result.data.items).toHaveLength(4);
    const uniqueIds = new Set(result.data.items.flatMap((item) => item.questionIds));
    expect(uniqueIds.size).toBe(8);
  });

  // Sin nombres de empresas reales en los specs (viajan al repo público): las
  // colecciones personales se verifican por disco, contra las carpetas que
  // existan. Sus conteos exactos quedan registrados en el planning de la
  // instancia; el árbol público no tiene ninguna (el sync no emite las carpetas
  // de ofertas reales) y el loop queda vacío sin romperse.
  test('las colecciones personales en disco traen nota en cada ejercicio', () => {
    const offersDir = path.resolve('docs', 'job-offers');
    for (const entry of fs.readdirSync(offersDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = path.join(offersDir, entry.name, 'collection.json');
      if (!fs.existsSync(file)) continue;
      const result = interviewCollectionSchema.safeParse(JSON.parse(fs.readFileSync(file, 'utf8')));
      expect(issuesOf(result), file).toEqual([]);
      if (!result.success) continue;
      for (const item of result.data.items) {
        expect(item.note, `${file} · ${item.id}`).not.toBeNull();
        expect(item.questionIds.length, item.id).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('assertCollectionQuestionIds pasa con las colecciones de disco', () => {
    const collections: InterviewCollection[] = withOffersSource('local', () => loadCollections());
    expect(collections.length).toBeGreaterThanOrEqual(1);
    expect(() => assertCollectionQuestionIds(collections, bankQuestionIds())).not.toThrow();
  });
});
