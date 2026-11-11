import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  interviewReviewPlanSchema,
  interviewReviewStateSchema
} from '../src/schemas/interview-review-plan';
import {
  assertReviewPlanQuestionIds,
  emptyInterviewReviewState,
  interviewReviewStateStore,
  itemStatus,
  loadReviewPlans,
  missingReviewPlanQuestionIds,
  reviewMarkKey,
  setActiveSlug,
  setItemStatus
} from '../src/lib/interview-review-plan';
import { PROGRESS_STORAGE_KEY, REVIEW_STATE_STORAGE_KEY } from '../src/scripts/storage-keys';

process.env.OFFERS_SOURCE = 'demo';

const DEMO_SLUGS = [
  '2026-10-05-aurora-labs-reactjs-frontend-developer',
  '2026-10-05-nimbus-software-senior-frontend-engineer'
];

function readFixture(slug: string): Record<string, unknown> {
  const file = path.resolve('docs', 'job-offers', slug, 'interview-review-plan.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
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

function issuesOf(result: ReturnType<typeof interviewReviewPlanSchema.safeParse>): string[] {
  if (result.success) return [];
  return result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
}

test.describe('Contrato del plan de repaso (ADR-0035)', () => {
  test('los planes demo validan y todos sus questionIds existen en el banco', () => {
    for (const slug of DEMO_SLUGS) {
      const result = interviewReviewPlanSchema.safeParse(readFixture(slug));
      expect(issuesOf(result)).toEqual([]);
      if (!result.success) return;
      expect(result.data.version).toBe(1);
      expect(result.data.slug).toBe(slug);
      expect(result.data.items.length).toBeGreaterThanOrEqual(3);
      expect(missingReviewPlanQuestionIds(result.data, bankQuestionIds())).toEqual([]);
    }
  });

  test('loadReviewPlans lista los planes demo en disco con sus items en orden', () => {
    const plans = loadReviewPlans();
    const slugs = plans.map((plan) => plan.slug);
    for (const slug of DEMO_SLUGS) {
      expect(slugs).toContain(slug);
    }
    for (const plan of plans) {
      expect(plan.items.length).toBeGreaterThanOrEqual(3);
      for (const item of plan.items) {
        expect(item.questionIds.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('un questionId inexistente en el banco se reporta y rompe la validacion cruzada', () => {
    const broken = clone(readFixture(DEMO_SLUGS[0]));
    (broken.items as { questionIds: string[] }[])[0].questionIds.push('not-a-question');
    const parsed = interviewReviewPlanSchema.safeParse(broken);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(missingReviewPlanQuestionIds(parsed.data, bankQuestionIds())).toEqual(['not-a-question']);
    expect(() => assertReviewPlanQuestionIds([parsed.data], bankQuestionIds())).toThrow(
      /unknown question ids: not-a-question/
    );
  });

  test('los ids de item duplicados fallan la validacion', () => {
    const broken = clone(readFixture(DEMO_SLUGS[0]));
    const items = broken.items as unknown[];
    items.push(clone(items[0]));
    const result = interviewReviewPlanSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('Duplicate item id');
  });

  test('un questionId duplicado dentro de un item falla la validacion', () => {
    const broken = clone(readFixture(DEMO_SLUGS[1]));
    const first = (broken.items as { questionIds: string[] }[])[0];
    first.questionIds.push(first.questionIds[0]);
    const result = interviewReviewPlanSchema.safeParse(broken);
    expect(result.success).toBe(false);
    expect(issuesOf(result).join('\n')).toContain('Duplicate question id');
  });

  test('la forma invalida falla: sin items, sin version o con fechas mal formadas', () => {
    const base = readFixture(DEMO_SLUGS[0]);
    expect(interviewReviewPlanSchema.safeParse({ ...clone(base), items: [] }).success).toBe(false);
    expect(interviewReviewPlanSchema.safeParse({ ...clone(base), version: 2 }).success).toBe(false);
    expect(
      interviewReviewPlanSchema.safeParse({ ...clone(base), generatedAt: '12/10/2026' }).success
    ).toBe(false);
    expect(interviewReviewPlanSchema.safeParse({ ...clone(base), gaps: [{}] }).success).toBe(false);
  });

  test('el estado del repaso vive en su clave propia y marca por tema', () => {
    expect(interviewReviewStateStore.key).toBe(REVIEW_STATE_STORAGE_KEY);
    expect(interviewReviewStateStore.key).not.toBe(PROGRESS_STORAGE_KEY);

    const state = emptyInterviewReviewState();
    expect(interviewReviewStateSchema.safeParse(state).success).toBe(true);
    expect(itemStatus(state, DEMO_SLUGS[0], 'testing-vitest-rtl')).toBe('pendiente');

    const marked = setItemStatus(state, DEMO_SLUGS[0], 'testing-vitest-rtl', 'dominado');
    expect(marked.marks[reviewMarkKey(DEMO_SLUGS[0], 'testing-vitest-rtl')]).toBe('dominado');
    expect(interviewReviewStateSchema.safeParse(marked).success).toBe(true);

    const unmarked = setItemStatus(marked, DEMO_SLUGS[0], 'testing-vitest-rtl', 'pendiente');
    expect(unmarked.marks[reviewMarkKey(DEMO_SLUGS[0], 'testing-vitest-rtl')]).toBeUndefined();

    const active = setActiveSlug(state, DEMO_SLUGS[1]);
    expect(active.activeSlug).toBe(DEMO_SLUGS[1]);
    expect(interviewReviewStateSchema.safeParse(active).success).toBe(true);
  });
});
