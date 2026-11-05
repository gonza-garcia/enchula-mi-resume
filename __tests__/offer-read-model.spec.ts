import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listOffers, parseUrlAlternativas } from '../src/lib/job-offers';

process.env.OFFERS_SOURCE = 'demo';

/**
 * Read model de ofertas (H0c): los links a la oferta publicada en el frontmatter
 * de `offer.md` (`url` principal y `url_alternativa`, repetible por contrato: las
 * otras URLs del mismo aviso que encuentra el chequeo de duplicados, pudiendo
 * traer una nota despues de la URL) y el orden default del listado.
 */

interface Fixture {
  slug: string;
  offer: string;
  application?: string;
}

function fixture(slug: string, urlAlternativas: string[] = [], application?: string): Fixture {
  return {
    slug,
    offer: [
      '---',
      'empresa: X',
      `rol: ${slug}`,
      `fecha: ${slug.slice(0, 10)}`,
      'demo: true',
      'url: https://ejemplo.test/principal',
      ...urlAlternativas.map((value) => `url_alternativa: ${value}`),
      '---',
      '',
      '# Oferta original',
      ''
    ].join('\n'),
    application
  };
}

function writeFixture(entries: Fixture[]): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'offer-read-model-'));
  for (const entry of entries) {
    const dir = path.resolve(tmp, 'docs', 'job-offers', entry.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'offer.md'), entry.offer);
    if (entry.application) {
      fs.writeFileSync(path.join(dir, 'application.md'), entry.application);
    }
  }
  return tmp;
}

test.describe('url_alternativa en offer.md', () => {
  test('cada valor es un link, con su nota separada si la trae', () => {
    const links = parseUrlAlternativas(
      [
        '---',
        'empresa: X',
        'url: https://ejemplo.test/a',
        'url_alternativa: https://ejemplo.test/b (mismo aviso, publicacion duplicada)',
        'url_alternativa: https://ejemplo.test/c',
        'url_alternativa: solo texto, sin url',
        '---',
        '',
        '# Oferta original',
        ''
      ].join('\n')
    );
    expect(links).toEqual([
      { url: 'https://ejemplo.test/b', nota: 'mismo aviso, publicacion duplicada' },
      { url: 'https://ejemplo.test/c', nota: null }
    ]);
  });

  test('sin frontmatter o sin url_alternativa devuelve lista vacia', () => {
    expect(parseUrlAlternativas('# Oferta original\n')).toEqual([]);
    expect(parseUrlAlternativas('---\nempresa: X\nurl: N/A\n---\n# Oferta\n')).toEqual([]);
  });

  test('un valor que no es URL no se convierte en link', () => {
    expect(parseUrlAlternativas('---\nurl_alternativa: N/A\n---\n')).toEqual([]);
  });
});

test.describe('Orden default del listado de ofertas', () => {
  test('fecha descendente, sin colar las postuladas primero', () => {
    const application = (estado: string, extra = '') =>
      `---\nempresa: X\nrol: Y\nfecha: 2026-01-01\nestado: ${estado}\n${extra}---\n`;
    const tmp = writeFixture([
      fixture('2026-01-01-antigua-rol', [], application('descartada', 'motivo: gap duro\n')),
      fixture('2026-01-02-media-rol'),
      fixture('2026-01-03-reciente-rol', [], application('enviada'))
    ]);
    try {
      const slugs = listOffers(tmp).map((listing) => listing.slug);
      // La que no tiene application.md queda en su lugar cronologico: antes las
      // postuladas se colaban primero y el feed no era la cronologia de capturas.
      expect(slugs).toEqual([
        '2026-01-03-reciente-rol',
        '2026-01-02-media-rol',
        '2026-01-01-antigua-rol'
      ]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  test('mismo dia: el slug descendente desempata, para que el orden sea estable', () => {
    const tmp = writeFixture([fixture('2026-01-05-aaa-rol'), fixture('2026-01-05-zzz-rol')]);
    try {
      expect(listOffers(tmp).map((listing) => listing.slug)).toEqual([
        '2026-01-05-zzz-rol',
        '2026-01-05-aaa-rol'
      ]);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});

test.describe('Codificacion del verbatim capturado', () => {
  /**
   * Mojibake tipico de las herramientas de captura: UTF-8 leido como CP1252
   * ("é" como `Ã©`, "ção" como `Ã§Ã£`, las comillas y rayas como `â€...`). El
   * verbatim de la oferta es el texto de la oferta, no el error de codificacion
   * de la herramienta: si algo de esto llega a disco, se repara en la captura.
   */
  const MOJIBAKE = /[\u00c2\u00c3][\u0080-\u00bf]|â€[\u0080-\u00ff]/;

  test('ningun archivo de docs/job-offers guarda texto con mojibake', () => {
    const root = path.resolve('docs', 'job-offers');
    const offenders: string[] = [];
    for (const slug of fs.readdirSync(root)) {
      const dir = path.join(root, slug);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const file of fs.readdirSync(dir)) {
        const raw = fs.readFileSync(path.join(dir, file), 'utf8');
        const match = raw.match(MOJIBAKE);
        if (match) offenders.push(`${slug}/${file} -> ${JSON.stringify(match[0])}`);
      }
    }
    expect(offenders, `mojibake en el verbatim capturado:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('la deteccion cubre el patron que traia la oferta en portugues', () => {
    expect(MOJIBAKE.test('Este Ã© um cargo remoto')).toBe(true);
    expect(MOJIBAKE.test('CriaÃ§Ã£o de Design Systems')).toBe(true);
    expect(MOJIBAKE.test('abre â€\u009ccomillasâ€\u009d')).toBe(true);
    expect(MOJIBAKE.test('Este é um cargo remoto — ok')).toBe(false);
  });
});
