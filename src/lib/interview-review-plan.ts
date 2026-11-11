import fs from 'node:fs';
import path from 'node:path';
import {
  interviewReviewPlanSchema,
  type InterviewReviewPlan
} from '../schemas/interview-review-plan';
import { listOffers, JOBS_DIR, REVIEW_PLAN_FILE } from './job-offers';

export { REVIEW_PLAN_FILE };
export * from './interview-review-state';

/**
 * Los planes de repaso viven en la carpeta de su oferta y se listan igual que las
 * ofertas: en un build generico solo entran los de ofertas `demo: true`.
 */
export function loadReviewPlans(cwd: string = process.cwd()): InterviewReviewPlan[] {
  const plans: InterviewReviewPlan[] = [];
  for (const offer of listOffers(cwd)) {
    const file = path.resolve(cwd, JOBS_DIR, offer.slug, REVIEW_PLAN_FILE);
    if (!fs.existsSync(file)) continue;
    const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));
    plans.push(interviewReviewPlanSchema.parse(raw));
  }
  return plans;
}

/** Ids de pregunta del banco que faltan en un plan de repaso. */
export function missingReviewPlanQuestionIds(
  plan: InterviewReviewPlan,
  bankQuestionIds: ReadonlySet<string>
): string[] {
  const missing = new Set<string>();
  for (const item of plan.items) {
    for (const questionId of item.questionIds) {
      if (!bankQuestionIds.has(questionId)) missing.add(questionId);
    }
  }
  return Array.from(missing);
}

/**
 * Validacion cruzada con el banco: todo questionId del plan tiene que existir.
 * Falla ruidosamente en build, nombrando el id y el plan (mismo criterio que el
 * check de areas de quiz de /interview).
 */
export function assertReviewPlanQuestionIds(
  plans: InterviewReviewPlan[],
  bankQuestionIds: ReadonlySet<string>
): void {
  for (const plan of plans) {
    const missing = missingReviewPlanQuestionIds(plan, bankQuestionIds);
    if (missing.length > 0) {
      throw new Error(
        `Review plan "${plan.slug}" references unknown question ids: ${missing.join(', ')}.`
      );
    }
  }
}
