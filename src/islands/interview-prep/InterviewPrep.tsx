import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ChangeEvent
} from 'react';
import {
  INTERVIEW_FREQUENCIES,
  INTERVIEW_LANGUAGES,
  INTERVIEW_LEVELS,
  INTERVIEW_ROLES,
  type InterviewFrequency,
  type InterviewLanguage,
  type InterviewLevel,
  type InterviewMcq,
  type InterviewProgress,
  type InterviewProgressEntry,
  type InterviewRole
} from '../../schemas/interview-questions';
import {
  areaLabel,
  countProgressedQuestions,
  filterAndSortQuestions,
  FREQUENCY_LABELS,
  interviewProgressStore,
  interviewUiStateStore,
  LEVEL_LABELS,
  loadInterviewUiState,
  localizedText,
  PROGRESS_STATUSES,
  PROGRESS_STATUS_LABELS,
  questionProgress,
  ROLE_LABELS,
  searchQuestionsByRank,
  setQuestionProgress,
  type InterviewFilters,
  type InterviewQuestionView,
  type InterviewSearchGroups,
  type InterviewSearchLevel,
  type InterviewSort,
  type InterviewUiState,
  type RenderedCodeShell
} from '../../lib/interview-prep';
import {
  CLEAR_MESSAGE,
  clearProgress as clearStoredProgress,
  exportProgress,
  importProgressFile,
  loadProgress,
  saveProgress
} from '../../lib/progress-storage';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Toaster, toast } from '@/components/ui/toast';
import {
  interviewReviewStateStore,
  itemStatus,
  setActiveSlug,
  setItemStatus
} from '../../lib/interview-review-state';
import type { InterviewReviewPlan, InterviewReviewState } from '../../schemas/interview-review-plan';
import { INTERVIEW_LANG_STORAGE_KEY, LEVEL_STYLE_STORAGE_KEY } from '../../scripts/storage-keys';

const LEVEL_STYLES = ['traffic', 'cool', 'neutral'] as const;
type LevelStyle = (typeof LEVEL_STYLES)[number];
const LEVEL_STYLE_LABELS: Record<LevelStyle, string> = {
  traffic: 'Semáforo',
  cool: 'Fría',
  neutral: 'Neutra'
};

interface SourceLink {
  label: string;
  url: string;
}

interface RenderedScenario {
  id: string;
  prompt: string;
  rubric: string[];
  code: RenderedCodeShell;
  modelAnswerHtml: string;
}

interface QuizView {
  area: string;
  mcqs: InterviewMcq[];
  scenarios: RenderedScenario[];
}

interface AreaGroup {
  label: string;
  areas: string[];
}

interface PlanAreaLink {
  phaseId: string;
  phaseTitle: { es: string; en: string };
  skillNames: { es: string; en: string }[];
}

interface InterviewPrepProps {
  questions: InterviewQuestionView[];
  quizzes: QuizView[];
  areaLabels: Record<string, string>;
  areaGroups: AreaGroup[];
  sources: SourceLink[];
  planLinks?: Record<string, PlanAreaLink>;
  reviewPlans?: InterviewReviewPlan[];
}

const ALL_LEVELS: InterviewLevel[] = [...INTERVIEW_LEVELS];
const ALL_ROLES: InterviewRole[] = [...INTERVIEW_ROLES];
const ALL_FREQUENCIES: InterviewFrequency[] = [...INTERVIEW_FREQUENCIES];

function initialFilters(areas: string[]): InterviewFilters {
  return {
    areas,
    levels: ALL_LEVELS,
    roles: ALL_ROLES,
    frequencies: ALL_FREQUENCIES,
    search: '',
    onlyCuriosidades: false,
    onlyCode: false
  };
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function levelClass(level: InterviewLevel): string {
  return `level-${level}`;
}

// El markdown (prosa, tablas y code blocks con shell de Shiki) viene
// pre-renderizado del build; en la isla solo queda el fallback de idioma campo
// por campo con `localizedText` (ADR-0046).

// Búsqueda global (cambio 6): Command con ranking área > título > respuesta y
// acciones claras por resultado (ir / practicar). Seleccionar un resultado
// navega a la pregunta: la respuesta se muestra siempre en el detalle.
const SEARCH_LEVEL_ORDER: InterviewSearchLevel[] = ['area', 'title', 'answer'];
const SEARCH_LEVEL_HEADINGS: Record<InterviewSearchLevel, string> = {
  area: 'Coinciden en el área',
  title: 'Coinciden en el título',
  answer: 'Coinciden en la respuesta'
};
const SEARCH_RESULTS_PER_LEVEL = 8;

function GlobalSearch({
  open,
  query,
  groups,
  totalQuestions,
  areaLabels,
  lang,
  onOpenChange,
  onQueryChange,
  onGoTo,
  onPractice
}: {
  open: boolean;
  query: string;
  groups: InterviewSearchGroups;
  totalQuestions: number;
  areaLabels: Record<string, string>;
  lang: InterviewLanguage;
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onGoTo: (questionId: string) => void;
  onPractice: (area: string) => void;
}) {
  const total = SEARCH_LEVEL_ORDER.reduce((count, level) => count + groups[level].length, 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Búsqueda global"
      description="Busca en el banco por área, título de pregunta o respuesta"
    >
      <Command shouldFilter={false}>
        <CommandInput
          aria-label="Búsqueda global"
          placeholder="Buscar en el banco..."
          value={query}
          onValueChange={onQueryChange}
        />
        <CommandList>
          {query.trim().length === 0 ? (
            <p className="search-hint">
              Escribí para buscar en las {totalQuestions} preguntas. ↑↓ para moverte, Enter para abrir.
            </p>
          ) : total === 0 ? (
            <p className="search-empty">Sin resultados para “{query.trim()}”.</p>
          ) : null}
          {SEARCH_LEVEL_ORDER.map((level) => {
            const matches = groups[level];
            if (matches.length === 0) return null;
            return (
              <CommandGroup
                key={level}
                heading={`${SEARCH_LEVEL_HEADINGS[level]} (${matches.length})`}
              >
                {matches.slice(0, SEARCH_RESULTS_PER_LEVEL).map(({ question }) => (
                  <div key={`${level}-${question.id}`} className="search-result-row">
                    <CommandItem
                      value={`${level}-${question.id}`}
                      onSelect={() => onGoTo(question.id)}
                      className="search-result-main"
                    >
                      <span className="search-result-copy">
                        <span
                          className="search-result-title"
                          dangerouslySetInnerHTML={{ __html: localizedText(question.rendered.question, lang) }}
                        />
                        <span className="search-result-meta">
                          {areaLabel(question.area, areaLabels)} · {LEVEL_LABELS[question.level]}
                        </span>
                      </span>
                    </CommandItem>
                    <button
                      type="button"
                      className="search-result-action"
                      onClick={() => onPractice(question.area)}
                    >
                      Practicar
                    </button>
                  </div>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

// Botón '?' con tooltip de ayuda (Fase A, cambio 4). El contenido vive en el
// tooltip: hover y focus lo abren, Escape lo cierra.
function HelpTip({ label, text }: { label: string; text: string }) {
  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger className="help-tip" type="button" aria-label={label}>
          ?
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>{text}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// "Mis notas": contraído por defecto, salvo que haya una nota guardada (nunca
// esconder contenido del usuario). Se monta por pregunta (key en el uso) para
// recalcular el estado abierto al cambiar de detalle.
function NoteSection({
  progress,
  onProgressChange
}: {
  progress: InterviewProgressEntry;
  onProgressChange: (patch: Partial<InterviewProgressEntry>) => void;
}) {
  const [open, setOpen] = useState(() => progress.note.trim().length > 0);
  const previousNote = useRef(progress.note);

  useEffect(() => {
    const note = progress.note;
    if (note.trim().length > 0 && previousNote.current.trim().length === 0) setOpen(true);
    previousNote.current = note;
  }, [progress.note]);

  return (
    <Collapsible className="note-block" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="section-kicker section-trigger" type="button">
        <span className="section-dot" />
        <span className="section-trigger-label">Mis notas</span>
        <span className="section-trigger-mark" aria-hidden="true" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="note-field">
          <textarea
            aria-label="Mis notas"
            value={progress.note}
            onChange={(event) => onProgressChange({ note: event.target.value })}
            placeholder="Tu resumen, ideas a recordar, links..."
            rows={4}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Checkbox del árbol de áreas (cambio 5): soporta estado indeterminado para
// los padres (Todas las áreas / grupo) que manejan un subtree de sub-áreas.
function AreaCheckbox({
  label,
  checked,
  indeterminate = false,
  onToggle
}: {
  label: string;
  checked: boolean;
  indeterminate?: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="checkbox-row">
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={() => onToggle()}
        aria-label={label}
      />
      <span>{label}</span>
    </label>
  );
}

function CheckboxGroup<T extends string>({
  label,
  values,
  selected,
  labels,
  onToggle
}: {
  label: string;
  values: T[];
  selected: T[];
  labels: Record<T, string>;
  onToggle: (value: T) => void;
}) {
  return (
    <fieldset className="filter-group">
      <legend>{label}</legend>
      <div className="checkbox-list">
        {values.map((value) => (
          <label key={value} className="checkbox-row">
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            <span>{labels[value]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function FilterSidebar({
  filters,
  areas,
  areaGroups,
  areaLabels,
  levelStyle,
  onUpdate,
  onSetLevelStyle,
  onReset,
  onOpenSearch
}: {
  filters: InterviewFilters;
  areas: string[];
  areaGroups: AreaGroup[];
  areaLabels: Record<string, string>;
  levelStyle: LevelStyle;
  onUpdate: (updater: (current: InterviewFilters) => InterviewFilters) => void;
  onSetLevelStyle: (style: LevelStyle) => void;
  onReset: () => void;
  onOpenSearch: () => void;
}) {
  const selectedAreaCount = filters.areas.length;

  return (
    <aside className="interview-filters" aria-label="Filtros de preguntas">
      <div className="filters-heading">
        <div>
          <p className="eyebrow">Afiná tu práctica</p>
          <h2>Filtros</h2>
        </div>
        <button type="button" className="text-button" onClick={onReset}>Limpiar</button>
      </div>

      <button type="button" className="global-search-trigger" onClick={onOpenSearch}>
        <span>Búsqueda global</span>
        <kbd>⌘K</kbd>
      </button>

      <label className="search-field">
        <span>Filtro</span>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => onUpdate((current) => ({ ...current, search: event.target.value }))}
          placeholder="Filtrar tarjetas por texto..."
          aria-label="Filtro de preguntas"
        />
      </label>

      <fieldset className="filter-group area-filter-group">
        <legend>Área</legend>
        <p className="sr-only" aria-live="polite">
          {selectedAreaCount === areas.length
            ? 'Todas las áreas seleccionadas'
            : `${selectedAreaCount} de ${areas.length} áreas seleccionadas`}
        </p>
        <AreaCheckbox
          label="Todas las áreas"
          checked={selectedAreaCount === areas.length}
          indeterminate={selectedAreaCount > 0 && selectedAreaCount < areas.length}
          onToggle={() => onUpdate((current) => ({
            ...current,
            areas: current.areas.length === areas.length ? [] : [...areas]
          }))}
        />
        <div className="area-groups">
          {areaGroups.map((group) => {
            const selectedInGroup = group.areas.filter((area) => filters.areas.includes(area)).length;
            const groupComplete = selectedInGroup === group.areas.length;
            return (
              <Collapsible key={group.label} className="area-group" defaultOpen>
                <div className="area-group-head">
                  <AreaCheckbox
                    label={group.label}
                    checked={groupComplete}
                    indeterminate={selectedInGroup > 0 && !groupComplete}
                    onToggle={() => onUpdate((current) => ({
                      ...current,
                      areas: groupComplete
                        ? current.areas.filter((area) => !group.areas.includes(area))
                        : [...new Set([...current.areas, ...group.areas])]
                    }))}
                  />
                  <CollapsibleTrigger
                    className="area-fold"
                    type="button"
                    aria-label={`Plegar o expandir ${group.label}`}
                  >
                    <span className="area-fold-mark" aria-hidden="true" />
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="area-group-areas">
                  {group.areas.map((area) => (
                    <AreaCheckbox
                      key={area}
                      label={areaLabel(area, areaLabels)}
                      checked={filters.areas.includes(area)}
                      onToggle={() => onUpdate((current) => ({
                        ...current,
                        areas: toggleValue(current.areas, area)
                      }))}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </fieldset>

      <CheckboxGroup
        label="Nivel"
        values={ALL_LEVELS}
        selected={filters.levels}
        labels={LEVEL_LABELS}
        onToggle={(value) => onUpdate((current) => ({
          ...current,
          levels: toggleValue(current.levels, value) as InterviewLevel[]
        }))}
      />
      <CheckboxGroup
        label="Rol"
        values={ALL_ROLES}
        selected={filters.roles}
        labels={ROLE_LABELS}
        onToggle={(value) => onUpdate((current) => ({
          ...current,
          roles: toggleValue(current.roles, value) as InterviewRole[]
        }))}
      />
      <CheckboxGroup
        label="Frecuencia"
        values={ALL_FREQUENCIES}
        selected={filters.frequencies}
        labels={FREQUENCY_LABELS}
        onToggle={(value) => onUpdate((current) => ({
          ...current,
          frequencies: toggleValue(current.frequencies, value) as InterviewFrequency[]
        }))}
      />

      <fieldset className="filter-group">
        <legend>Atajos</legend>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={filters.onlyCuriosidades}
            onChange={(event) => onUpdate((current) => ({ ...current, onlyCuriosidades: event.target.checked }))}
          />
          <span>Con curiosidades</span>
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={filters.onlyCode}
            onChange={(event) => onUpdate((current) => ({ ...current, onlyCode: event.target.checked }))}
          />
          <span>Tiene código</span>
        </label>
      </fieldset>

      <fieldset className="filter-group level-style-group">
        <legend>Colores por nivel</legend>
        <div className="style-picker" role="group" aria-label="Estilo de colores por nivel">
          {LEVEL_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              className={levelStyle === style ? 'style-choice active' : 'style-choice'}
              aria-pressed={levelStyle === style}
              onClick={() => onSetLevelStyle(style)}
            >
              {LEVEL_STYLE_LABELS[style]}
            </button>
          ))}
        </div>
      </fieldset>
    </aside>
  );
}

function QuestionCard({
  question,
  areaLabel,
  lang,
  active,
  onSelect
}: {
  question: InterviewQuestionView;
  areaLabel: string;
  lang: InterviewLanguage;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? 'question-card active' : 'question-card'}
      aria-pressed={active}
      onClick={onSelect}
    >
      <span className="card-topline">
        <span className={`level-pill ${levelClass(question.level)}`}>{LEVEL_LABELS[question.level]}</span>
        <span className="card-index">{question.id.split('-').slice(-1)[0]}</span>
      </span>
      <span className="card-area">{areaLabel}</span>
      <span
        className="card-question"
        dangerouslySetInnerHTML={{ __html: localizedText(question.rendered.question, lang) }}
      />
      <span className="card-footer">
        <span>{question.topic.replaceAll('-', ' ')}</span>
        <span className="card-flags" aria-label="Características">
          {question.curiosidades.length > 0 && <span title="Tiene curiosidades">C</span>}
          {question.hasCode && <span title="Tiene código">&lt;/&gt;</span>}
        </span>
      </span>
    </button>
  );
}

function DetailPanel({
  question,
  areaLabel,
  lang,
  progress,
  onPractice,
  onProgressChange
}: {
  question: InterviewQuestionView | null;
  areaLabel: string;
  lang: InterviewLanguage;
  progress: InterviewProgressEntry;
  onPractice: () => void;
  onProgressChange: (patch: Partial<InterviewProgressEntry>) => void;
}) {
  if (!question) {
    return (
      <section className="detail-panel empty-detail" aria-label="Detalle de pregunta">
        <p className="eyebrow">No hay coincidencias</p>
        <h2>Probá con otros filtros</h2>
        <p>Ampliá el área, el nivel o la búsqueda para volver a ver preguntas.</p>
      </section>
    );
  }

  return (
    <section className="detail-panel" aria-label="Detalle de pregunta" data-question-id={question.id}>
      <div className="detail-topline">
        <div className="detail-meta">
          <span className={`level-pill ${levelClass(question.level)}`}>{LEVEL_LABELS[question.level]}</span>
          <span className="detail-area">{areaLabel}</span>
          <span className="detail-frequency">{FREQUENCY_LABELS[question.frequency]}</span>
        </div>
        <button type="button" className="practice-link" onClick={onPractice}>
          Practicar esta área
        </button>
      </div>
      <p className="detail-topic">{question.topic.replaceAll('-', ' ')}</p>
      <h2 dangerouslySetInnerHTML={{ __html: localizedText(question.rendered.question, lang) }} />

      <div className="answer-panel">
        <div
          className="answer-copy"
          dangerouslySetInnerHTML={{ __html: localizedText(question.rendered.answer, lang) }}
        />
      </div>

      {question.curiosidades.length > 0 && (
        <section className="curiosity-list" key={`curiosidades-${question.id}`}>
          <div className="section-head">
            <div className="section-kicker">
              <span className="section-dot" />
              <span className="section-trigger-label">Curiosidades ({question.curiosidades.length})</span>
            </div>
            <HelpTip
              label="¿Qué es una curiosidad?"
              text="Repreguntas típicas del entrevistador que buscan que justifiques, acotes o matices tu respuesta. Contestarlas bien muestra que conocés el tema hasta su límite."
            />
          </div>
          {question.rendered.curiosidades.map((curiosity, index) => (
            <article key={`${question.id}-curiosity-${index}`} className="curiosity-item">
              <h3 dangerouslySetInnerHTML={{ __html: localizedText(curiosity.question, lang) }} />
              <div
                className="answer-copy"
                dangerouslySetInnerHTML={{ __html: localizedText(curiosity.answer, lang) }}
              />
            </article>
          ))}
        </section>
      )}

      <div className="progress-block">
        <div className="section-kicker">
          <span className="section-dot" />
          Tu progreso
          <HelpTip
            label="¿Cómo funciona Tu progreso?"
            text="Sin marcar: todavía no la repasaste. Sé: la respondés bien sin mirar. Repasar: la idea está, pero hay que reforzarla."
          />
        </div>
        <div className="status-picker" role="group" aria-label="Estado de aprendizaje">
          {PROGRESS_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className={progress.status === status ? 'status-choice active' : 'status-choice'}
              aria-pressed={progress.status === status}
              onClick={() => onProgressChange({ status })}
            >
              {PROGRESS_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        <NoteSection
          key={`notes-${question.id}`}
          progress={progress}
          onProgressChange={onProgressChange}
        />      </div>

      <div className="detail-bottom">
        <div className="role-list" aria-label="Roles relacionados">
          {question.roles.map((role) => <span key={role}>{ROLE_LABELS[role]}</span>)}
        </div>
        <div className="source-links">
          {question.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuizPanel({ quiz, areaTitle }: { quiz: QuizView; areaTitle: string }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  return (
    <div className="quiz-panel">
      <div className="quiz-intro">
        <p className="eyebrow">Práctica guiada</p>
        <h3>{areaTitle}</h3>
        <p>Contestá sin mirar y abrí la explicación para calibrar tu respuesta.</p>
      </div>
      <div className="mcq-list">
        {quiz.mcqs.map((mcq, index) => {
          const selected = answers[mcq.id];
          const answered = selected !== undefined;
          return (
            <fieldset className="mcq" key={mcq.id}>
              <legend><span>{String(index + 1).padStart(2, '0')}</span>{mcq.question}</legend>
              <div className="mcq-options">
                {mcq.options.map((option, optionIndex) => (
                  <label
                    key={option}
                    className={answered && optionIndex === mcq.correctIndex ? 'mcq-option correct' : 'mcq-option'}
                  >
                    <input
                      type="radio"
                      name={mcq.id}
                      value={optionIndex}
                      checked={selected === optionIndex}
                      onChange={() => setAnswers((current) => ({ ...current, [mcq.id]: optionIndex }))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {answered && (
                <div className={selected === mcq.correctIndex ? 'mcq-feedback good' : 'mcq-feedback'}>
                  <strong>{selected === mcq.correctIndex ? 'Correcto' : 'Revisá esta'}</strong>
                  <p>{mcq.explanation}</p>
                </div>
              )}
            </fieldset>
          );
        })}
      </div>
      <div className="scenario-list">
        <div className="section-kicker"><span className="section-dot" />Escenarios de código</div>
        {quiz.scenarios.map((scenario) => (
          <details className="scenario" key={scenario.id}>
            <summary>{scenario.prompt}</summary>
            <div dangerouslySetInnerHTML={{ __html: scenario.code.html }} />
            <div className="scenario-answer">
              <h4>Respuesta modelo</h4>
              <div
                className="answer-copy"
                dangerouslySetInnerHTML={{ __html: scenario.modelAnswerHtml }}
              />
              <h4>Qué busca el entrevistador</h4>
              <ul>
                {scenario.rubric.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

// Plan de repaso por oferta (ADR-0035): temas priorizados con sus preguntas del
// banco, huecos a repasar fuera de /interview y marcas por tema en su propia clave
// de estado (`interview-review`), sin tocar `interview-progress`.
function ReviewPanel({
  plan,
  state,
  questionsById,
  lang,
  onlyReview,
  onToggleOnlyReview,
  onToggleMark,
  onExit,
  onGoToQuestion
}: {
  plan: InterviewReviewPlan;
  state: InterviewReviewState;
  questionsById: Map<string, InterviewQuestionView>;
  lang: InterviewLanguage;
  onlyReview: boolean;
  onToggleOnlyReview: () => void;
  onToggleMark: (itemId: string, done: boolean) => void;
  onExit: () => void;
  onGoToQuestion: (questionId: string) => void;
}) {
  const doneCount = plan.items.filter(
    (item) => itemStatus(state, plan.slug, item.id) === 'dominado'
  ).length;
  return (
    <section className="review-panel" aria-label={`Repaso de ${plan.empresa}`}>
      <div className="review-head">
        <div>
          <p className="eyebrow">Repaso de entrevista</p>
          <h2>{plan.empresa}</h2>
          <p className="review-meta">
            {plan.rol} · match {plan.matchScore ?? '—'}/100 · {doneCount}/{plan.items.length} temas
            dominados
          </p>
        </div>
        <div className="review-head-actions">
          <label className="review-filter">
            <input type="checkbox" checked={onlyReview} onChange={onToggleOnlyReview} />
            Filtrar el listado al repaso
          </label>
          <button type="button" className="review-exit" onClick={onExit}>
            Salir del repaso
          </button>
        </div>
      </div>
      <ol className="review-items">
        {plan.items.map((item, index) => {
          const done = itemStatus(state, plan.slug, item.id) === 'dominado';
          return (
            <li key={item.id} className={done ? 'review-item review-item-done' : 'review-item'}>
              <div className="review-item-head">
                <span className="review-item-order" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="review-item-copy">
                  <h3>{item.tema}</h3>
                  {item.why && <p>{item.why}</p>}
                </div>
                <Checkbox
                  checked={done}
                  onCheckedChange={(checked) => onToggleMark(item.id, checked === true)}
                  aria-label={`Marcar "${item.tema}" como dominado`}
                />
              </div>
              <div className="review-question-chips">
                {item.questionIds.map((questionId) => {
                  const target = questionsById.get(questionId);
                  return (
                    <button
                      key={questionId}
                      type="button"
                      className="review-chip"
                      title={target ? localizedText(target.question, lang) : questionId}
                      onClick={() => onGoToQuestion(questionId)}
                    >
                      <span
                        dangerouslySetInnerHTML={{
                          __html: target ? localizedText(target.rendered.question, lang) : questionId
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
      {plan.gaps.length > 0 && (
        <div className="review-gaps">
          <div className="section-kicker">
            <span className="section-dot" />
            Huecos del banco
          </div>
          <ul>
            {plan.gaps.map((gap) => (
              <li key={gap.topic}>
                <strong>{gap.topic}</strong>
                {gap.note ? ` — ${gap.note}` : ''}
              </li>
            ))}
          </ul>
          <p className="review-gaps-note">Se repasan fuera de /interview.</p>
        </div>
      )}
    </section>
  );
}

export default function InterviewPrep({
  questions,
  quizzes,
  areaLabels,
  areaGroups,
  sources,
  planLinks = {},
  reviewPlans = []
}: InterviewPrepProps) {
  const areas = areaGroups.flatMap((group) => group.areas);
  // Estado de la vista persistido en localStorage: filtros, orden y selección se
  // restauran al montar la isla (Astro es MPA y al volver a la ruta todo se
  // remonta). `null` = sin estado utilizable guardado: arranca por defecto.
  const [restoredUi] = useState<InterviewUiState | null>(() =>
    loadInterviewUiState(areas, questions.map((question) => question.id))
  );
  const [filters, setFilters] = useState<InterviewFilters>(
    () => restoredUi?.filters ?? initialFilters(areas)
  );
  const [sort, setSort] = useState<InterviewSort>(() => restoredUi?.sort ?? 'level-asc');
  const [randomSeed, setRandomSeed] = useState(() => restoredUi?.randomSeed ?? 1);
  const [selectedId, setSelectedId] = useState<string | null>(() => restoredUi?.selectedId ?? null);
  const [levelStyle, setLevelStyle] = useState<LevelStyle>('traffic');
  // Idioma del contenido EN/ES (ADR-0046): default EN (el idioma de las
  // entrevistas) y persistido en `interview-lang`. Los textos de UI no cambian.
  const [lang, setLang] = useState<InterviewLanguage>('en');
  const [practiceArea, setPracticeArea] = useState<string | null>(null);
  const [progress, setProgress] = useState<InterviewProgress>(() =>
    loadProgress(interviewProgressStore)
  );
  const [progressFeedback, setProgressFeedback] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewState, setReviewState] = useState<InterviewReviewState>(() =>
    loadProgress(interviewReviewStateStore)
  );
  const [reviewDialogSlug, setReviewDialogSlug] = useState<string | null>(null);
  const [onlyReview, setOnlyReview] = useState(() => restoredUi?.onlyReview ?? false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const deferredSearch = useDeferredValue(filters.search);
  const effectiveFilters = { ...filters, search: deferredSearch };
  const baseVisibleQuestions = filterAndSortQuestions(
    questions,
    effectiveFilters,
    sort,
    randomSeed,
    areaLabels
  );
  const activeReview = reviewPlans.find((plan) => plan.slug === reviewState.activeSlug) ?? null;
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const reviewQuestionIds = new Set(
    activeReview ? activeReview.items.flatMap((item) => item.questionIds) : []
  );
  const visibleQuestions =
    onlyReview && activeReview
      ? baseVisibleQuestions.filter((question) => reviewQuestionIds.has(question.id))
      : baseVisibleQuestions;
  const selected = questions.find((question) => question.id === selectedId) ?? visibleQuestions[0] ?? null;
  const selectedAreaLabel = selected ? areaLabel(selected.area, areaLabels) : '';
  const selectedQuiz = practiceArea ? quizzes.find((quiz) => quiz.area === practiceArea) ?? null : null;
  const searchGroups = searchQuestionsByRank(questions, searchQuery, areaLabels);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LEVEL_STYLE_STORAGE_KEY);
      if (stored && (LEVEL_STYLES as readonly string[]).includes(stored)) {
        setLevelStyle(stored as LevelStyle);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(INTERVIEW_LANG_STORAGE_KEY);
      if (stored && (INTERVIEW_LANGUAGES as readonly string[]).includes(stored)) {
        setLang(stored as InterviewLanguage);
      }
    } catch {}
  }, []);

  // Marker de hidratación para las specs, igual que OffersManager con
  // data-offers-hydrated: sin esto, interactuar antes de hidratar pierde los
  // onChange de React (era la causa del flake de los sorts).
  useEffect(() => {
    document.documentElement.setAttribute('data-interview-hydrated', 'true');
    return () => document.documentElement.removeAttribute('data-interview-hydrated');
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LEVEL_STYLE_STORAGE_KEY, levelStyle);
    } catch {}
  }, [levelStyle]);

  useEffect(() => {
    try {
      localStorage.setItem(INTERVIEW_LANG_STORAGE_KEY, lang);
    } catch {}
  }, [lang]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('quiz');
    if (requested && quizzes.some((quiz) => quiz.area === requested)) {
      setPracticeArea(requested);
      window.requestAnimationFrame(() => {
        document.getElementById('practice')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [quizzes]);

  // Plan de repaso (ADR-0035): el deep link ?repaso=<slug> pide confirmación antes
  // de cargar; un repaso ya confirmado en sesiones previas se muestra sin diálogo.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('repaso');
    if (!requested) return;
    if (!reviewPlans.some((plan) => plan.slug === requested)) return;
    if (loadProgress(interviewReviewStateStore).activeSlug === requested) return;
    setReviewDialogSlug(requested);
  }, [reviewPlans]);

  useEffect(() => {
    setReviewState(loadProgress(interviewReviewStateStore));
  }, []);

  useEffect(() => {
    saveProgress(interviewReviewStateStore, reviewState);
  }, [reviewState]);

  useEffect(() => {
    setProgress(loadProgress(interviewProgressStore));
  }, []);

  useEffect(() => {
    saveProgress(interviewProgressStore, progress);
  }, [progress]);

  // Mismo patrón que `progress`: el initializer de useState corre también en el
  // SSR del build (sin localStorage) y este effect re-aplica lo guardado tras la
  // hidratación. Si no hay nada utilizable guardado no se pisa el estado.
  useEffect(() => {
    const restored = loadInterviewUiState(areas, questions.map((question) => question.id));
    if (!restored) return;
    setFilters(restored.filters);
    setSort(restored.sort);
    setRandomSeed(restored.randomSeed);
    setSelectedId(restored.selectedId);
    setOnlyReview(restored.onlyReview);
  }, []);

  useEffect(() => {
    saveProgress(interviewUiStateStore, {
      version: 1,
      filters,
      sort,
      randomSeed,
      selectedId,
      onlyReview
    });
  }, [filters, sort, randomSeed, selectedId, onlyReview]);

  useEffect(() => {
    if (selected?.id !== selectedId) setSelectedId(selected?.id ?? null);
  }, [selected?.id, selectedId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const resetFilters = () => {
    startTransition(() => setFilters(initialFilters(areas)));
  };

  const changeSort = (nextSort: InterviewSort) => {
    setSort(nextSort);
    if (nextSort === 'random') setRandomSeed((seed) => seed + 1);
  };

  const reshuffleRandom = () => {
    setRandomSeed((seed) => seed + 1);
  };

  const showPractice = (area: string) => {
    setPracticeArea(area);
    window.requestAnimationFrame(() => {
      document.getElementById('practice')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const scrollToDetail = () => {
    window.requestAnimationFrame(() => {
      document.querySelector('.detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const goToQuestion = (questionId: string) => {
    setSelectedId(questionId);
    setSearchOpen(false);
    scrollToDetail();
  };

  const practiceFromSearch = (area: string) => {
    setSearchOpen(false);
    showPractice(area);
  };

  const confirmReviewLoad = (slug: string) => {
    const plan = reviewPlans.find((candidate) => candidate.slug === slug);
    if (!plan) return;
    setReviewState((current) => setActiveSlug(current, slug));
    setReviewDialogSlug(null);
    setOnlyReview(false);
    toast.add({ title: `Repaso de ${plan.empresa} cargado.`, type: 'success', timeout: 5000 });
  };

  const exitReview = () => {
    setReviewState((current) => setActiveSlug(current, null));
    setOnlyReview(false);
  };

  const toggleReviewMark = (itemId: string, done: boolean) => {
    if (!activeReview) return;
    setReviewState((current) =>
      setItemStatus(current, activeReview.slug, itemId, done ? 'dominado' : 'pendiente')
    );
  };

  const updateQuestionProgress = (patch: Partial<InterviewProgressEntry>) => {
    if (!selected) return;
    setProgress((current) => setQuestionProgress(current, selected.id, patch));
    setProgressFeedback(null);
  };

  const exportProgressFile = () => {
    exportProgress(interviewProgressStore, progress, 'interview-progress.json');
  };

  const importProgress = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = await importProgressFile(interviewProgressStore, file);
    if (result.ok) setProgress(result.value);
    setProgressFeedback(result.message);
  };

  const clearProgress = () => {
    setProgress(clearStoredProgress(interviewProgressStore));
    setProgressFeedback(CLEAR_MESSAGE);
  };

  return (
    <div className={`interview-app level-style-${levelStyle}`}>
      <header className="interview-header">
        <div className="interview-header-inner">
          <div className="interview-brand-row">
            <span className="header-label">Interview prep</span>
            <div className="lang-toggle" role="group" aria-label="Idioma del contenido">
              {INTERVIEW_LANGUAGES.map((language) => (
                <button
                  key={language}
                  type="button"
                  className={lang === language ? 'active' : undefined}
                  aria-pressed={lang === language}
                  onClick={() => setLang(language)}
                >
                  {language.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="interview-heading">
            <div>
              <p className="eyebrow">Una pregunta a la vez</p>
              <h1>Prep entrevistas</h1>
              <p className="header-description">
                Un mapa de estudio para responder con claridad, ampliar cada respuesta con curiosidades
                y practicar lo que realmente preguntan.
              </p>
            </div>
            <div className="header-stats" aria-label="Resumen del banco">
              <div><strong>{questions.length}</strong><span>preguntas</span></div>
              <div><strong>{questions.filter((question) => question.curiosidades.length > 0).length}</strong><span>con curiosidades</span></div>
              <div><strong>{quizzes.length}</strong><span>áreas de quiz</span></div>
            </div>
          </div>
        </div>
      </header>

      <div className="interview-layout">
        <FilterSidebar
          filters={filters}
          areas={areas}
          areaGroups={areaGroups}
          areaLabels={areaLabels}
          levelStyle={levelStyle}
          onUpdate={setFilters}
          onSetLevelStyle={setLevelStyle}
          onReset={resetFilters}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <main className="interview-main" id="main-content">
          {activeReview && (
            <ReviewPanel
              plan={activeReview}
              state={reviewState}
              questionsById={questionsById}
              lang={lang}
              onlyReview={onlyReview}
              onToggleOnlyReview={() => setOnlyReview((value) => !value)}
              onToggleMark={toggleReviewMark}
              onExit={exitReview}
              onGoToQuestion={goToQuestion}
            />
          )}
          <div className="results-toolbar">
            <div>
              <p className="eyebrow">Banco de preguntas</p>
              <p className="results-count" aria-live="polite">
                <strong>{visibleQuestions.length}</strong> resultados
              </p>
            </div>
            <div className="toolbar-tools">
              <div className="progress-tools" role="group" aria-label="Progreso de estudio">
                <span className="progress-count">
                  {countProgressedQuestions(progress)}/{questions.length} con avance
                </span>
                <button type="button" className="progress-btn" onClick={exportProgressFile}>
                  Exportar progreso
                </button>
                <button type="button" className="progress-btn" onClick={() => importInputRef.current?.click()}>
                  Importar progreso
                </button>
                <button type="button" className="progress-btn" onClick={clearProgress}>
                  Limpiar progreso
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  aria-label="Archivo de progreso"
                  onChange={importProgress}
                />
              </div>
              <div className="sort-controls">
                <label className="sort-field">
                  <span>Ordenar</span>
                  <select value={sort} onChange={(event) => changeSort(event.target.value as InterviewSort)}>
                    <option value="level-asc">Nivel, de menor a mayor</option>
                    <option value="level-desc">Nivel, de mayor a menor</option>
                    <option value="frequency">Frecuencia</option>
                    <option value="random">Aleatorio</option>
                    <option value="area">Por área</option>
                  </select>
                </label>
                {sort === 'random' && (
                  <button type="button" className="reshuffle-button" onClick={reshuffleRandom}>
                    Re-mezclar
                  </button>
                )}
              </div>
            </div>
          </div>

          {progressFeedback && (
            <p className="progress-feedback" role="status">{progressFeedback}</p>
          )}

          <DetailPanel
            question={selected}
            areaLabel={selectedAreaLabel}
            lang={lang}
            progress={selected ? questionProgress(progress, selected.id) : { status: 'sin-marcar', note: '' }}
            onPractice={() => selected && showPractice(selected.area)}
            onProgressChange={updateQuestionProgress}
          />

          <section className="question-section" aria-labelledby="question-grid-title">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Explorá el banco</p>
                <h2 id="question-grid-title">Preguntas</h2>
              </div>
              <span className="section-count">{visibleQuestions.length} tarjetas</span>
            </div>
            {visibleQuestions.length > 0 ? (
              <div className="question-grid">
                {visibleQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    areaLabel={areaLabel(question.area, areaLabels)}
                    lang={lang}
                    active={question.id === selected?.id}
                    onSelect={() => setSelectedId(question.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results">
                <span className="no-results-mark">/</span>
                <h3>No encontramos preguntas con esos filtros.</h3>
                <p>Limpiá algún filtro o probá con otra palabra clave.</p>
                <button type="button" className="primary-button" onClick={resetFilters}>Restablecer filtros</button>
              </div>
            )}
          </section>

          <section className="practice-section" id="practice" aria-labelledby="practice-title">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Más allá de la respuesta</p>
                <h2 id="practice-title">Práctica y quizzes</h2>
              </div>
              <span className="section-count">{quizzes.reduce((count, quiz) => count + quiz.mcqs.length, 0)} preguntas de quiz</span>
            </div>
            <div className="quiz-area-picker" role="list" aria-label="Áreas de quiz">
              {quizzes.map((quiz) => {
                const planLink = planLinks[quiz.area];
                return (
                  <div key={quiz.area} role="listitem" className="quiz-area-item">
                    <button
                      type="button"
                      className={practiceArea === quiz.area ? 'quiz-area-button active' : 'quiz-area-button'}
                      aria-pressed={practiceArea === quiz.area}
                      onClick={() => setPracticeArea(quiz.area)}
                    >
                      <span>{areaLabel(quiz.area, areaLabels)}</span>
                      <small>{quiz.mcqs.length} preguntas · {quiz.scenarios.length} escenarios</small>
                    </button>
                    {planLink && (
                      <div className="quiz-area-plan">
                        <small>
                          Fase del plan: {planLink.phaseTitle.es}. Skills:{' '}
                          {planLink.skillNames.map((name) => name.es).join(', ')}
                        </small>
                        <a href={`/learning/#${planLink.phaseId}`}>Ver en el plan</a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedQuiz ? (
              <QuizPanel quiz={selectedQuiz} areaTitle={areaLabel(selectedQuiz.area, areaLabels)} />
            ) : (
              <div className="quiz-placeholder">
                <span className="placeholder-line" />
                <p>Elegí un área para abrir su quiz y sus escenarios de código.</p>
              </div>
            )}
          </section>

          <section className="sources-section" aria-labelledby="sources-title">
            <div className="section-heading-row">
              <div>
                <p className="eyebrow">Lecturas de respaldo</p>
                <h2 id="sources-title">Fuentes globales</h2>
              </div>
              <span className="section-count">{sources.length} enlaces</span>
            </div>
            <div className="sources-grid">
              {sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  <span>{source.label}</span>
                  <small>{new URL(source.url).hostname.replace(/^www\./, '')}</small>
                </a>
              ))}
            </div>
          </section>
        </main>
      </div>

      <GlobalSearch
        open={searchOpen}
        query={searchQuery}
        groups={searchGroups}
        totalQuestions={questions.length}
        areaLabels={areaLabels}
        lang={lang}
        onOpenChange={setSearchOpen}
        onQueryChange={setSearchQuery}
        onGoTo={goToQuestion}
        onPractice={practiceFromSearch}
      />

      {reviewDialogSlug &&
        (() => {
          const plan = reviewPlans.find((candidate) => candidate.slug === reviewDialogSlug);
          if (!plan) return null;
          const questionCount = plan.items.reduce((count, item) => count + item.questionIds.length, 0);
          return (
            <AlertDialog
              open
              onOpenChange={(open) => {
                if (!open) setReviewDialogSlug(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cargar el repaso de {plan.empresa}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {plan.rol} · match {plan.matchScore ?? '—'}/100. {plan.items.length} temas
                    priorizados ({questionCount} preguntas del banco) y {plan.gaps.length}{' '}
                    {plan.gaps.length === 1 ? 'hueco' : 'huecos'} a repasar fuera de /interview. Tu
                    progreso de estudio (Sé / Repasar y notas) no se toca.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => confirmReviewLoad(plan.slug)}>
                    Cargar repaso
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        })()}

      <Toaster />
    </div>
  );
}
