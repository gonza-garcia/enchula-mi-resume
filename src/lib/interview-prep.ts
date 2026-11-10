import type {
  InterviewFrequency,
  InterviewLevel,
  InterviewProgress,
  InterviewProgressEntry,
  InterviewProgressStatus,
  InterviewQuestion,
  InterviewRole,
  InterviewSort,
  InterviewTrickyItem,
  InterviewUiState
} from '../schemas/interview-questions';
import { interviewProgressSchema, interviewUiStateSchema } from '../schemas/interview-questions';
import { PROGRESS_STORAGE_KEY, UI_STATE_STORAGE_KEY } from '../scripts/storage-keys';
import { loadProgress, type ProgressStore } from './progress-storage';

export const interviewProgressStore: ProgressStore<InterviewProgress> = {
  key: PROGRESS_STORAGE_KEY,
  schema: interviewProgressSchema,
  empty: () => emptyProgress()
};

// Estado de la vista de /interview (filtros, orden, selección y filtro del
// repaso). A diferencia de los stores de progreso, "sin nada guardado" no es un
// estado válido a restaurar: el store devuelve `null` cuando no hay estado
// utilizable y la isla cae a los filtros por defecto. Así una selección vacía
// guardada a propósito (facetado estricto: 0 resultados) se distingue de la
// primera visita.
export const interviewUiStateStore: ProgressStore<InterviewUiState | null> = {
  key: UI_STATE_STORAGE_KEY,
  schema: interviewUiStateSchema,
  empty: () => null
};

// Al restaurar se valida contra el contenido vigente: las áreas que ya no
// existen se descartan (intersección con las áreas actuales) y si la selección
// guardada quedó vacía por drift se vuelve a "todas las áreas" en vez de
// restaurar una vista sin resultados (una selección vacía guardada a propósito sí
// se respeta). Un id de pregunta inexistente se limpia.
export function sanitizeInterviewUiState(
  state: InterviewUiState,
  areas: string[],
  questionIds: Iterable<string>
): InterviewUiState {
  const knownAreas = new Set(areas);
  const keptAreas = state.filters.areas.filter((area) => knownAreas.has(area));
  const safeAreas =
    keptAreas.length > 0 || state.filters.areas.length === 0 ? keptAreas : [...areas];
  const knownIds = new Set(questionIds);
  return {
    ...state,
    filters: { ...state.filters, areas: safeAreas },
    selectedId: state.selectedId && knownIds.has(state.selectedId) ? state.selectedId : null
  };
}

export function loadInterviewUiState(
  areas: string[],
  questionIds: Iterable<string>
): InterviewUiState | null {
  const stored = loadProgress(interviewUiStateStore);
  return stored ? sanitizeInterviewUiState(stored, areas, questionIds) : null;
}

export type { InterviewSort, InterviewUiState };

export interface RenderedCodeBlock {
  language: string;
  code: string;
  caption: string;
  html: string;
}

export interface InterviewQuestionView extends Omit<InterviewQuestion, 'codeBlocks'> {
  codeBlocks: RenderedCodeBlock[];
  trickies: InterviewTrickyItem[];
}

export interface InterviewFilters {
  areas: string[];
  levels: InterviewLevel[];
  roles: InterviewRole[];
  frequencies: InterviewFrequency[];
  search: string;
  onlyTricky: boolean;
  onlyCode: boolean;
}

export const LEVEL_ORDER: Record<InterviewLevel, number> = {
  junior: 0,
  'semi-senior': 1,
  senior: 2,
  'staff-lead': 3,
  architect: 4
};

export const FREQUENCY_ORDER: Record<InterviewFrequency, number> = {
  'muy-preguntada': 0,
  'clave-menos-frecuente': 1,
  'clave-muy-poco-frecuente': 2
};

export const LEVEL_LABELS: Record<InterviewLevel, string> = {
  junior: 'Junior',
  'semi-senior': 'Semi-senior',
  senior: 'Senior',
  'staff-lead': 'Staff / Lead',
  architect: 'Architect'
};

export const FREQUENCY_LABELS: Record<InterviewFrequency, string> = {
  'muy-preguntada': 'Muy preguntada',
  'clave-menos-frecuente': 'Clave, menos frecuente',
  'clave-muy-poco-frecuente': 'Clave, muy poco frecuente'
};

export const ROLE_LABELS: Record<InterviewRole, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Fullstack'
};

export const PROGRESS_STATUSES: InterviewProgressStatus[] = ['sin-marcar', 'se', 'repasar'];

export const PROGRESS_STATUS_LABELS: Record<InterviewProgressStatus, string> = {
  'sin-marcar': 'Sin marcar',
  se: 'Sé',
  repasar: 'Repasar'
};

export function emptyProgress(): InterviewProgress {
  return { version: 1, entries: {} };
}

export function questionProgress(
  progress: InterviewProgress,
  questionId: string
): InterviewProgressEntry {
  return progress.entries[questionId] ?? { status: 'sin-marcar', note: '' };
}

export function setQuestionProgress(
  progress: InterviewProgress,
  questionId: string,
  patch: Partial<InterviewProgressEntry>
): InterviewProgress {
  const current = questionProgress(progress, questionId);
  const merged: InterviewProgressEntry = { ...current, ...patch };
  const entries = { ...progress.entries };
  if (merged.status === 'sin-marcar' && merged.note.trim() === '') {
    delete entries[questionId];
  } else {
    entries[questionId] = merged;
  }
  return { version: 1, entries };
}

export function countProgressedQuestions(progress: InterviewProgress): number {
  return Object.values(progress.entries).filter(
    (entry) => entry.status !== 'sin-marcar' || entry.note.trim() !== ''
  ).length;
}

export function areaLabel(area: string, labels: Record<string, string>): string {
  return labels[area] ?? area;
}

function normalize(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function searchText(question: InterviewQuestionView, areaLabel: string): string {
  return normalize(
    [
      question.id,
      areaLabel,
      question.topic,
      question.question.en,
      question.answer.en,
      ...question.roles,
      ...question.tags,
      ...question.trickies.flatMap((tricky) => [tricky.question, tricky.answer, tricky.trap])
    ].join(' ')
  );
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, 'en', { sensitivity: 'base' });
}

// Búsqueda global (Fase A, cambio 6): ranking área > título de pregunta >
// respuesta. Cada pregunta cae en su MEJOR nivel de coincidencia y el orden
// dentro del nivel respeta el orden del banco.
export type InterviewSearchLevel = 'area' | 'title' | 'answer';

export interface InterviewSearchMatch {
  question: InterviewQuestionView;
  level: InterviewSearchLevel;
}

export interface InterviewSearchGroups {
  area: InterviewSearchMatch[];
  title: InterviewSearchMatch[];
  answer: InterviewSearchMatch[];
}

export function searchQuestionsByRank(
  questions: InterviewQuestionView[],
  query: string,
  areaLabels: Record<string, string>
): InterviewSearchGroups {
  const needle = normalize(query.trim());
  const groups: InterviewSearchGroups = { area: [], title: [], answer: [] };
  if (needle.length === 0) return groups;
  for (const question of questions) {
    const level: InterviewSearchLevel | null = normalize(areaLabel(question.area, areaLabels)).includes(needle)
      ? 'area'
      : normalize(question.question.en).includes(needle)
        ? 'title'
        : normalize(question.answer.en).includes(needle)
          ? 'answer'
          : null;
    if (level) groups[level].push({ question, level });
  }
  return groups;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function filterAndSortQuestions(
  questions: InterviewQuestionView[],
  filters: InterviewFilters,
  sort: InterviewSort,
  randomSeed: number,
  areaLabels: Record<string, string>
): InterviewQuestionView[] {
  const query = normalize(filters.search.trim());
  const filtered = questions.filter((question) => {
    // Facetado estricto (Fase A, cambio 5): selección vacía = 0 resultados, igual
    // en áreas, nivel, rol y frecuencia. El árbol queda coherente (☐ = nada).
    const matchesArea = filters.areas.includes(question.area);
    const matchesLevel = filters.levels.includes(question.level);
    const matchesRole = filters.roles.some((role) => question.roles.includes(role));
    const matchesFrequency = filters.frequencies.includes(question.frequency);
    const matchesTricky = !filters.onlyTricky || question.trickies.length > 0;
    const matchesCode = !filters.onlyCode || question.codeBlocks.length > 0;
    const matchesSearch =
      query.length === 0 ||
      searchText(question, areaLabel(question.area, areaLabels)).includes(query);

    return (
      matchesArea &&
      matchesLevel &&
      matchesRole &&
      matchesFrequency &&
      matchesTricky &&
      matchesCode &&
      matchesSearch
    );
  });

  return [...filtered].sort((left, right) => {
    if (sort === 'random') {
      const randomOrder = stableHash(`${left.id}:${randomSeed}`) - stableHash(`${right.id}:${randomSeed}`);
      return randomOrder || compareText(left.id, right.id);
    }

    if (sort === 'frequency') {
      const frequencyOrder = FREQUENCY_ORDER[left.frequency] - FREQUENCY_ORDER[right.frequency];
      if (frequencyOrder !== 0) return frequencyOrder;
    }

    if (sort === 'area') {
      const areaOrder = compareText(
        areaLabel(left.area, areaLabels),
        areaLabel(right.area, areaLabels)
      );
      if (areaOrder !== 0) return areaOrder;
    }

    if (sort === 'level-asc' || sort === 'level-desc') {
      const direction = sort === 'level-asc' ? 1 : -1;
      const levelOrder = (LEVEL_ORDER[left.level] - LEVEL_ORDER[right.level]) * direction;
      if (levelOrder !== 0) return levelOrder;
    } else {
      const levelOrder = LEVEL_ORDER[left.level] - LEVEL_ORDER[right.level];
      if (levelOrder !== 0) return levelOrder;
    }

    return compareText(left.id, right.id);
  });
}
