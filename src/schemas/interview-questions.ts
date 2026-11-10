import { z } from 'astro/zod';

const nonEmptyString = z.string().min(1);

export const interviewLevelSchema = z.enum([
  'junior',
  'semi-senior',
  'senior',
  'staff-lead',
  'architect'
]);

export const interviewRoleSchema = z.enum(['frontend', 'backend', 'fullstack']);

export const interviewFrequencySchema = z.enum([
  'muy-preguntada',
  'clave-menos-frecuente',
  'clave-muy-poco-frecuente'
]);

export const INTERVIEW_LEVELS = interviewLevelSchema.options;
export const INTERVIEW_ROLES = interviewRoleSchema.options;
export const INTERVIEW_FREQUENCIES = interviewFrequencySchema.options;

const englishTextSchema = z.object({ en: nonEmptyString });

export const interviewSourceSchema = z.object({
  label: nonEmptyString,
  url: z.url()
});

export const interviewCodeBlockSchema = z.object({
  language: nonEmptyString,
  code: nonEmptyString,
  caption: nonEmptyString
});

export const interviewQuestionSchema = z.object({
  id: nonEmptyString,
  area: nonEmptyString,
  topic: nonEmptyString,
  level: interviewLevelSchema,
  roles: z.array(interviewRoleSchema).min(1),
  frequency: interviewFrequencySchema,
  question: englishTextSchema,
  answer: englishTextSchema,
  codeBlocks: z.array(interviewCodeBlockSchema),
  trickies: z.array(z.unknown()).length(0),
  sources: z.array(interviewSourceSchema).min(1).max(3),
  tags: z.array(nonEmptyString).max(4)
});

export const interviewQuestionBankSchema = z
  .object({
    area: nonEmptyString,
    generatedAt: nonEmptyString,
    questions: z.array(interviewQuestionSchema).min(1)
  })
  .superRefine((bank, ctx) => {
    const seen = new Set<string>();
    for (const [index, question] of bank.questions.entries()) {
      if (question.area !== bank.area) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'area'],
          message: `Expected area "${bank.area}" but found "${question.area}"`
        });
      }
      if (seen.has(question.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['questions', index, 'id'],
          message: `Duplicate question id "${question.id}"`
        });
      }
      seen.add(question.id);
    }
  });

export const interviewTrickyItemSchema = z.object({
  question: nonEmptyString,
  answer: nonEmptyString,
  trap: nonEmptyString
});

export const interviewTrickyGroupSchema = z.object({
  id: nonEmptyString,
  items: z.array(interviewTrickyItemSchema).min(1).max(2)
});

export const interviewMcqSchema = z.object({
  id: nonEmptyString,
  question: nonEmptyString,
  options: z.array(nonEmptyString).length(4),
  correctIndex: z.int().min(0).max(3),
  explanation: nonEmptyString
});

export const interviewScenarioSchema = z.object({
  id: nonEmptyString,
  prompt: nonEmptyString,
  code: z.object({
    language: nonEmptyString,
    code: nonEmptyString
  }),
  modelAnswer: nonEmptyString,
  rubric: z.array(nonEmptyString).min(3).max(5)
});

export const interviewTrickyQuizSchema = z.object({
  area: nonEmptyString,
  generatedAt: nonEmptyString,
  trickies: z.array(interviewTrickyGroupSchema),
  quiz: z.object({
    mcqs: z.array(interviewMcqSchema).min(10).max(12),
    scenarios: z.array(interviewScenarioSchema).min(3).max(4)
  })
});

export const interviewProgressStatusSchema = z.enum(['sin-marcar', 'se', 'repasar']);

export const interviewProgressEntrySchema = z.object({
  status: interviewProgressStatusSchema,
  note: z.string().max(4000)
});

export const interviewProgressSchema = z.object({
  version: z.literal(1),
  entries: z.record(z.string(), interviewProgressEntrySchema)
});

export const interviewSortSchema = z.enum([
  'level-asc',
  'level-desc',
  'frequency',
  'random',
  'area'
]);

// Estado de la vista de /interview (filtros, orden y pregunta seleccionada).
// Astro es MPA: al volver a la ruta la isla se remonta y sin esta clave se
// pierde el estado de UI. Las áreas y los ids de pregunta son contenido dinámico
// y se validan contra el banco vigente al restaurar (ver
// `sanitizeInterviewUiState` en `src/lib/interview-prep.ts`).
export const interviewUiStateSchema = z.object({
  version: z.literal(1),
  filters: z.object({
    areas: z.array(nonEmptyString),
    levels: z.array(interviewLevelSchema),
    roles: z.array(interviewRoleSchema),
    frequencies: z.array(interviewFrequencySchema),
    search: z.string().max(2000),
    onlyTricky: z.boolean(),
    onlyCode: z.boolean()
  }),
  sort: interviewSortSchema,
  randomSeed: z.int().min(0),
  selectedId: z.string().min(1).nullable(),
  onlyReview: z.boolean()
});

export type InterviewLevel = z.infer<typeof interviewLevelSchema>;
export type InterviewRole = z.infer<typeof interviewRoleSchema>;
export type InterviewFrequency = z.infer<typeof interviewFrequencySchema>;
export type InterviewSource = z.infer<typeof interviewSourceSchema>;
export type InterviewCodeBlock = z.infer<typeof interviewCodeBlockSchema>;
export type InterviewQuestion = z.infer<typeof interviewQuestionSchema>;
export type InterviewQuestionBank = z.infer<typeof interviewQuestionBankSchema>;
export type InterviewTrickyItem = z.infer<typeof interviewTrickyItemSchema>;
export type InterviewTrickyGroup = z.infer<typeof interviewTrickyGroupSchema>;
export type InterviewMcq = z.infer<typeof interviewMcqSchema>;
export type InterviewScenario = z.infer<typeof interviewScenarioSchema>;
export type InterviewTrickyQuiz = z.infer<typeof interviewTrickyQuizSchema>;
export type InterviewProgressStatus = z.infer<typeof interviewProgressStatusSchema>;
export type InterviewProgressEntry = z.infer<typeof interviewProgressEntrySchema>;
export type InterviewProgress = z.infer<typeof interviewProgressSchema>;
export type InterviewSort = z.infer<typeof interviewSortSchema>;
export type InterviewUiState = z.infer<typeof interviewUiStateSchema>;
