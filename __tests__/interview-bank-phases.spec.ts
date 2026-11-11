import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import {
  interviewQuestionBankSchema,
  interviewQuizFileSchema
} from '../src/schemas/interview-questions';
import { learningPlanSchema } from '../src/schemas/learning-plan';

const dir = path.resolve('src', 'content', 'interview-questions');
const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json'));
const bankFiles = files.filter((file) => !file.endsWith('.quiz.json'));
const quizFiles = files.filter((file) => file.endsWith('.quiz.json'));

function loadBank(name: string) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const parsed = interviewQuestionBankSchema.safeParse(raw);
  expect(parsed.success).toBe(true);
  return parsed.success ? parsed.data : null;
}

function loadQuiz(name: string) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const parsed = interviewQuizFileSchema.safeParse(raw);
  expect(parsed.success).toBe(true);
  return parsed.success ? parsed.data : null;
}

const PLAN_PHASE_AREAS = ['python-backend-cloud', 'llm-fundamentals', 'rag-retrieval', 'agents-mcp', 'evals-production'];
// Las 34 áreas finales (ADR-0046): 5 de fase del plan + 29 del frontend y la
// plataforma, con los splits de la taxonomía aprobada ya aplicados.
const ALL_AREAS = [
  'accesibilidad',
  'agents-mcp',
  'architecture-build',
  'auth',
  'backend',
  'bases-de-datos',
  'behavioral-career',
  'browser-web-apis',
  'ci-cd-y-cloud',
  'css',
  'data-fetching',
  'diseno-de-apis',
  'dsa-frontend',
  'estado-en-la-ui',
  'evals-production',
  'frameworks-ssr',
  'git',
  'html',
  'http-y-tiempo-real',
  'javascript',
  'llm-fundamentals',
  'mobile-web',
  'observability',
  'python-backend-cloud',
  'rag-retrieval',
  'react',
  'react-native',
  'seguridad',
  'styling-design-systems',
  'system-design-frontend',
  'testing-quality',
  'typescript',
  'ui-components-machine-coding',
  'web-performance'
];

// Conteo por área tras el corte por topic de la taxonomía aprobada.
const EXPECTED_COUNTS: Record<string, number> = {
  javascript: 20,
  typescript: 15,
  html: 7,
  css: 6,
  accesibilidad: 8,
  react: 25,
  'frameworks-ssr': 11,
  seguridad: 7,
  auth: 9,
  backend: 6,
  'bases-de-datos': 11,
  'mobile-web': 5,
  'react-native': 5,
  'http-y-tiempo-real': 7,
  'diseno-de-apis': 10,
  git: 3,
  'ci-cd-y-cloud': 9,
  'estado-en-la-ui': 16,
  'data-fetching': 10
};

test.describe('Banco reorganizado por fases del plan (ADR-0030) y taxonomía 34 (ADR-0046)', () => {
  test('las areas de fase siguen 1:1 con las fases del plan', () => {
    const planRaw = JSON.parse(
      fs.readFileSync(path.resolve('src', 'content', 'learning-plan.example.json'), 'utf8')
    );
    const plan = learningPlanSchema.safeParse(planRaw);
    expect(plan.success).toBe(true);
    if (!plan.success) return;

    const phaseAreas = plan.data.phases
      .map((phase) => phase.interviewArea)
      .filter((area): area is string => Boolean(area))
      .sort();
    expect(phaseAreas).toEqual([...PLAN_PHASE_AREAS].sort());

    for (const area of PLAN_PHASE_AREAS) {
      expect(files).toContain(`${area}.json`);
      expect(files).toContain(`${area}.quiz.json`);
    }
  });

  test('las preguntas reubicadas conservan su id con prefijo historico', () => {
    const moved = [
      'ai-agents-what-is-an-llm',
      'ai-agents-rag-pipeline-and-failure-modes',
      'ai-agents-mcp-architecture',
      'ai-agents-evals-and-regression-testing',
      'ai-agents-prompt-injection-defense'
    ];
    const allIds = new Set(
      bankFiles.flatMap((file) => (loadBank(file)?.questions ?? []).map((question) => question.id))
    );
    for (const id of moved) {
      expect(allIds.has(id)).toBe(true);
    }
    // Los ids con prefijo histórico del split viven en las áreas hijas nuevas.
    expect(loadBank('javascript.json')?.questions.map((question) => question.id)).toContain(
      'javascript-typescript-event-loop-model'
    );
    expect(loadBank('frameworks-ssr.json')?.questions.map((question) => question.id)).toContain(
      'react-frameworks-ui-angular-change-detection'
    );
  });

  test('las 34 areas del banco existen, con su quiz, y el corte por topic cuadra', () => {
    expect(bankFiles).toHaveLength(34);
    expect(quizFiles).toHaveLength(34);
    for (const area of ALL_AREAS) {
      const bank = loadBank(`${area}.json`);
      expect(bank, `missing bank ${area}`).not.toBeNull();
      expect(bank?.area).toBe(area);
      expect(files).toContain(`${area}.quiz.json`);
    }
    for (const [area, count] of Object.entries(EXPECTED_COUNTS)) {
      expect(loadBank(`${area}.json`)?.questions, `conteo de ${area}`).toHaveLength(count);
    }
  });

  test('cada area de fase tiene preguntas nuevas citadas, curiosidades y quiz por fase', () => {
    for (const area of PLAN_PHASE_AREAS) {
      const bank = loadBank(`${area}.json`);
      const quiz = loadQuiz(`${area}.quiz.json`);
      expect(bank).not.toBeNull();
      expect(quiz).not.toBeNull();
      if (!bank || !quiz) continue;

      expect(bank.questions.length).toBeGreaterThanOrEqual(4);
      for (const question of bank.questions) {
        expect(question.sources.length).toBeGreaterThanOrEqual(1);
        expect(question.sources.length).toBeLessThanOrEqual(3);
        for (const source of question.sources) {
          expect(source.url).toMatch(/^https?:\/\//);
        }
      }

      expect(quiz.quiz.mcqs.length).toBeGreaterThanOrEqual(10);
      expect(quiz.quiz.scenarios.length).toBeGreaterThanOrEqual(3);
      expect(bank.questions.reduce((count, question) => count + question.curiosidades.length, 0)).toBeGreaterThan(0);
    }
  });

  test('el contenido es bilingüe con fallback: en siempre, es puede quedar vacío', () => {
    let translated = 0;
    for (const file of bankFiles) {
      for (const question of loadBank(file)?.questions ?? []) {
        expect(question.question.en.length).toBeGreaterThan(0);
        expect(question.answer.en.length).toBeGreaterThan(0);
        if (question.question.es.length > 0) translated += 1;
        for (const curiosity of question.curiosidades) {
          expect(curiosity.question.en.length).toBeGreaterThan(0);
          expect(curiosity.answer.en.length).toBeGreaterThan(0);
        }
      }
    }
    // La muestra traducida de la migración.
    expect(translated).toBeGreaterThanOrEqual(1);
  });

  test('los temas prioritarios de la reevaluacion estan cubiertos por preguntas nuevas', () => {
    const texts = PLAN_PHASE_AREAS.flatMap((area) =>
      (loadBank(`${area}.json`)?.questions ?? []).map(
        (question) => `${question.id} ${question.question.en}`
      )
    ).join('\n');
    expect(texts).toContain('error analysis');
    expect(texts).toContain('NOT use RAG');
    expect(texts).toContain('token cost and latency');
    expect(texts).toContain('exfiltrating data');
    expect(texts).toContain('AI coding agents');
  });
});
