import { test, expect } from '@playwright/test';
import {
  interviewUiStateStore,
  loadInterviewUiState,
  sanitizeInterviewUiState
} from '../src/lib/interview-prep';
import {
  createMemoryStorage,
  saveProgress,
  setProgressStorageForTests
} from '../src/lib/progress-storage';
import type { InterviewUiState } from '../src/schemas/interview-questions';
import { UI_STATE_STORAGE_KEY } from '../src/scripts/storage-keys';

function makeUiState(overrides: Partial<InterviewUiState> = {}): InterviewUiState {
  return {
    version: 1,
    filters: {
      areas: ['a1'],
      levels: ['junior'],
      roles: ['frontend'],
      frequencies: ['muy-preguntada'],
      search: '',
      onlyCuriosidades: false,
      onlyCode: false
    },
    sort: 'level-asc',
    randomSeed: 1,
    selectedId: null,
    onlyReview: false,
    ...overrides
  };
}

const AREAS = ['a1', 'a2'];
const QUESTION_IDS = ['q1', 'q2'];

test.beforeEach(() => {
  setProgressStorageForTests(createMemoryStorage());
});

test.afterEach(() => {
  setProgressStorageForTests(null);
});

test.describe('Interview UI state (filtros, orden y selección)', () => {
  test('descarta áreas que ya no existen y conserva las válidas', () => {
    const state = makeUiState({
      filters: { ...makeUiState().filters, areas: ['a2', 'area-vieja'] }
    });
    const safe = sanitizeInterviewUiState(state, AREAS, QUESTION_IDS);
    expect(safe.filters.areas).toEqual(['a2']);
  });

  test('respeta una selección vacía guardada a propósito', () => {
    const state = makeUiState({ filters: { ...makeUiState().filters, areas: [] } });
    const safe = sanitizeInterviewUiState(state, AREAS, QUESTION_IDS);
    expect(safe.filters.areas).toEqual([]);
  });

  test('si todas las áreas guardadas desaparecieron vuelve a todas las actuales', () => {
    const state = makeUiState({
      filters: { ...makeUiState().filters, areas: ['area-vieja'] }
    });
    const safe = sanitizeInterviewUiState(state, AREAS, QUESTION_IDS);
    expect(safe.filters.areas).toEqual(AREAS);
  });

  test('limpia un selectedId inexistente y conserva uno vigente', () => {
    const gone = sanitizeInterviewUiState(
      makeUiState({ selectedId: 'q-vieja' }),
      AREAS,
      QUESTION_IDS
    );
    expect(gone.selectedId).toBeNull();

    const kept = sanitizeInterviewUiState(makeUiState({ selectedId: 'q2' }), AREAS, QUESTION_IDS);
    expect(kept.selectedId).toBe('q2');
  });

  test('sin estado guardado o con estado inválido devuelve null (la isla cae a los defaults)', () => {
    const memory = createMemoryStorage();
    setProgressStorageForTests(memory);

    expect(loadInterviewUiState(AREAS, QUESTION_IDS)).toBeNull();

    memory.setItem(UI_STATE_STORAGE_KEY, '{ no es json');
    expect(loadInterviewUiState(AREAS, QUESTION_IDS)).toBeNull();

    memory.setItem(UI_STATE_STORAGE_KEY, JSON.stringify({ version: 2, filters: {} }));
    expect(loadInterviewUiState(AREAS, QUESTION_IDS)).toBeNull();

    saveProgress(interviewUiStateStore, makeUiState({ selectedId: 'q-vieja' }));
    const restored = loadInterviewUiState(AREAS, QUESTION_IDS);
    expect(restored).not.toBeNull();
    expect(restored?.selectedId).toBeNull();
    expect(restored?.filters.areas).toEqual(['a1']);
    expect(restored?.sort).toBe('level-asc');
  });
});
