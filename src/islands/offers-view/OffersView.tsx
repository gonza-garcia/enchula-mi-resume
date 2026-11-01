import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ApplicationState,
  EstadoFilter,
  OfferRow,
  OffersViewProps,
  ViewerView
} from './contract';
import { ESTADO_FILTERS, VIEWER_VIEWS } from './contract';
import AdaptedCvView from './AdaptedCvView';
import ProfilePromptModal from './ProfilePromptModal';

const CONTRACT_STATES: ApplicationState[] = [
  'borrador',
  'en preparacion',
  'enviada',
  'confirmada',
  'vetada',
  'descartada'
];

const BADGE_CLASS: Record<string, string> = {
  enviada: 'of-badge-enviada',
  confirmada: 'of-badge-confirmada',
  vetada: 'of-badge-vetada',
  descartada: 'of-badge-descartada',
  borrador: 'of-badge-borrador',
  'en preparacion': 'of-badge-borrador',
  capturada: 'of-badge-capturada'
};

const TOP_MATCH = 80;
const SIN_FUENTE = 'sin-fuente';

function estadoOf(row: OfferRow): string {
  return row.application?.estado ?? 'capturada';
}

function fechaOf(row: OfferRow): string {
  return row.application?.fecha || row.fecha;
}

function labelForEstado(filter: EstadoFilter): string {
  if (filter === 'todas') return 'Todas';
  if (filter === 'capturadas') return 'Capturadas';
  if (filter === 'postuladas') return 'Postuladas';
  return filter.charAt(0).toUpperCase() + filter.slice(1);
}

/**
 * Vista "Ofertas" (Fase F, variante D): sidebar de filtros, cards compactas y
 * visor a la derecha con las 4 vistas. La data llega ya leida del build (las
 * carpetas de docs/job-offers); aca solo se filtra y se muestra. Sin seguimiento
 * ni acciones de envio: el Submit de cualquier postulacion lo aprieta el usuario.
 */
export default function OffersView({ rows, positionings, sources }: OffersViewProps) {
  const [estado, setEstado] = useState<EstadoFilter>('todas');
  const [perfil, setPerfil] = useState<string | null>(null);
  const [fuente, setFuente] = useState<string | null>(null);
  const [topMatches, setTopMatches] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [view, setView] = useState<ViewerView>('oferta');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // data-ofertas-hydrated: sin esto, interactuar antes de hidratar pierde los clicks.
    document.documentElement.setAttribute('data-ofertas-hydrated', 'true');
    return () => document.documentElement.removeAttribute('data-ofertas-hydrated');
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const counts = useMemo(() => {
    const byState = new Map<string, number>();
    const byPerfil = new Map<string, number>();
    const byFuente = new Map<string, number>();
    let capturadas = 0;
    let postuladas = 0;
    let top = 0;
    let sinFuente = 0;
    for (const row of rows) {
      if (row.application) {
        postuladas += 1;
        byState.set(row.application.estado, (byState.get(row.application.estado) ?? 0) + 1);
      } else {
        capturadas += 1;
      }
      if ((row.matchScore ?? 0) >= TOP_MATCH) top += 1;
      for (const id of row.perfiles) {
        const key = id.toLowerCase();
        byPerfil.set(key, (byPerfil.get(key) ?? 0) + 1);
      }
      if (row.fuente) byFuente.set(row.fuente, (byFuente.get(row.fuente) ?? 0) + 1);
      else sinFuente += 1;
    }
    return { todas: rows.length, capturadas, postuladas, top, byState, byPerfil, byFuente, sinFuente };
  }, [rows]);

  const stateFilters = useMemo(() => {
    const extras = CONTRACT_STATES.filter((state) => (counts.byState.get(state) ?? 0) > 0);
    return [...ESTADO_FILTERS, ...extras];
  }, [counts]);

  const visible = useMemo(() => {
    const filtered = rows.filter((row) => {
      if (estado === 'capturadas' && row.application) return false;
      if (estado === 'postuladas' && !row.application) return false;
      if (
        estado !== 'todas' &&
        estado !== 'capturadas' &&
        estado !== 'postuladas' &&
        row.application?.estado !== estado
      ) {
        return false;
      }
      if (perfil && !row.perfiles.some((id) => id.toLowerCase() === perfil)) return false;
      if (fuente === SIN_FUENTE && row.fuente) return false;
      if (fuente && fuente !== SIN_FUENTE && row.fuente !== fuente) return false;
      if (topMatches && (row.matchScore ?? 0) < TOP_MATCH) return false;
      return true;
    });
    // Postuladas primero; dentro de cada grupo queda el orden natural (fecha desc).
    return [...filtered.filter((row) => row.application), ...filtered.filter((row) => !row.application)];
  }, [rows, estado, perfil, fuente, topMatches]);

  const selected = visible.find((row) => row.slug === selectedSlug) ?? visible[0] ?? null;

  const countForEstado = (filter: EstadoFilter): number => {
    if (filter === 'todas') return counts.todas;
    if (filter === 'capturadas') return counts.capturadas;
    if (filter === 'postuladas') return counts.postuladas;
    return counts.byState.get(filter) ?? 0;
  };

  const perfilTitle = (id: string): string =>
    positionings.find((positioning) => positioning.id.toLowerCase() === id.toLowerCase())?.title ?? id;

  const activeFile = (): { name: string; content: string; mime: string } | null => {
    if (!selected) return null;
    if (view === 'oferta') return { name: 'offer.md', content: selected.offerRaw, mime: 'text/markdown' };
    if (view === 'cv') {
      if (!selected.adaptedResume && !selected.adaptedRaw) return null;
      return {
        name: 'adapted-resume.json',
        content: selected.adaptedRaw ?? `${JSON.stringify(selected.adaptedResume, null, 2)}\n`,
        mime: 'application/json'
      };
    }
    if (view === 'cover') {
      return selected.coverRaw
        ? { name: 'cover-letter.md', content: selected.coverRaw, mime: 'text/markdown' }
        : null;
    }
    return selected.applicationRaw
      ? { name: 'application.md', content: selected.applicationRaw, mime: 'text/markdown' }
      : null;
  };

  const handleDownload = () => {
    const file = activeFile();
    setMenuOpen(false);
    if (!file) return;
    const blob = new Blob([file.content], { type: `${file.mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="of-shell">
      <aside className="of-side" aria-label="Filtros de ofertas">
        <div className="of-sec">Estado</div>
        {stateFilters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`of-item${estado === filter ? ' on' : ''}`}
            aria-pressed={estado === filter}
            onClick={() => setEstado(filter)}
          >
            <span>{labelForEstado(filter)}</span>
            <span className="of-count">{countForEstado(filter)}</span>
          </button>
        ))}

        <div className="of-sec">Perfil</div>
        {positionings.map((positioning) => {
          const key = positioning.id.toLowerCase();
          const active = perfil === key;
          return (
            <button
              key={positioning.id}
              type="button"
              className={`of-item${active ? ' on' : ''}`}
              aria-pressed={active}
              onClick={() => setPerfil(active ? null : key)}
            >
              <span>{positioning.title}</span>
              <span className="of-count">{counts.byPerfil.get(key) ?? 0}</span>
            </button>
          );
        })}
        <button type="button" className="of-item muted" onClick={() => setProfileModalOpen(true)}>
          <span>+ Agregar perfil</span>
        </button>

        <div className="of-sec">Fuente</div>
        {sources.map((source) => {
          const active = fuente === source.id;
          return (
            <button
              key={source.id}
              type="button"
              className={`of-item${active ? ' on' : ''}`}
              aria-pressed={active}
              onClick={() => setFuente(active ? null : source.id)}
            >
              <span>{source.nombre}</span>
              <span className="of-count">{counts.byFuente.get(source.id) ?? 0}</span>
            </button>
          );
        })}
        {counts.sinFuente > 0 && (
          <button
            type="button"
            className={`of-item${fuente === SIN_FUENTE ? ' on' : ''}`}
            aria-pressed={fuente === SIN_FUENTE}
            onClick={() => setFuente(fuente === SIN_FUENTE ? null : SIN_FUENTE)}
          >
            <span>Sin vínculo</span>
            <span className="of-count">{counts.sinFuente}</span>
          </button>
        )}

        <div className="of-sec">Score</div>
        <button
          type="button"
          className={`of-item${topMatches ? ' on' : ''}`}
          aria-pressed={topMatches}
          onClick={() => setTopMatches(!topMatches)}
        >
          <span>Top matches (&ge; {TOP_MATCH})</span>
          <span className="of-count">{counts.top}</span>
        </button>
      </aside>

      <div className="of-feed" aria-label="Ofertas">
        {visible.length === 0 ? (
          <div className="of-empty">
            <p>No hay ofertas con estos filtros.</p>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                setEstado('todas');
                setPerfil(null);
                setFuente(null);
                setTopMatches(false);
              }}
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          visible.map((row) => {
            const active = selected?.slug === row.slug;
            const motivoOConfirmacion = row.application?.motivo ?? row.application?.confirmacion ?? null;
            return (
              <button
                key={row.slug}
                type="button"
                className={`of-card${active ? ' sel' : ''}`}
                aria-pressed={active}
                onClick={() => setSelectedSlug(row.slug)}
              >
                <span
                  className={`of-score${(row.matchScore ?? 0) < TOP_MATCH ? ' mid' : ''}`}
                  aria-label={`Score match ${row.matchScore ?? 'sin score'}`}
                >
                  {row.matchScore ?? '-'}
                </span>
                <span className="of-card-body">
                  <span className="of-card-title">
                    {row.rol} <span className="muted">- {row.empresa}</span>
                  </span>
                  <span className="of-row tight">
                    <span className={`of-badge ${BADGE_CLASS[estadoOf(row)] ?? 'of-badge-borrador'}`}>
                      {estadoOf(row)}
                    </span>
                    <span className="muted tiny">
                      {fechaOf(row)}
                      {row.application?.ats ? ` - ${row.application.ats}` : ''}
                    </span>
                  </span>
                  <span className="of-row tight">
                    <span className="chip">{row.modalidad}</span>
                    {row.location && <span className="chip">{row.location}</span>}
                    {row.salario && <span className="chip">{row.salario}</span>}
                    {row.perfiles.map((id) => (
                      <span key={id} className="chip">
                        {perfilTitle(id)}
                      </span>
                    ))}
                  </span>
                  {motivoOConfirmacion && <span className="of-clamp">{motivoOConfirmacion}</span>}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="of-viewer">
        {selected ? (
          <>
            <div className="of-viewer-head">
              <div className="of-segmented" role="tablist" aria-label="Vistas del visor">
                {VIEWER_VIEWS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    id={`of-view-tab-${item.key}`}
                    aria-controls={`of-view-pane-${item.key}`}
                    aria-selected={view === item.key}
                    className={view === item.key ? 'on' : ''}
                    onClick={() => setView(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="of-menu-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="btn ghost of-menu-btn"
                  aria-label="Más acciones"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="8" cy="3" r="1.6" fill="currentColor"></circle>
                    <circle cx="8" cy="8" r="1.6" fill="currentColor"></circle>
                    <circle cx="8" cy="13" r="1.6" fill="currentColor"></circle>
                  </svg>
                </button>
                {menuOpen && (
                  <div className="of-menu">
                    <a
                      className={`of-menu-item${selected.hasReviewPlan ? '' : ' disabled'}`}
                      href={selected.hasReviewPlan ? `/interview/?repaso=${selected.slug}` : undefined}
                      aria-disabled={!selected.hasReviewPlan}
                      title={
                        selected.hasReviewPlan
                          ? 'Carga el repaso de esta oferta en Prep entrevistas: los temas priorizados del match-report con sus preguntas del banco y los huecos a repasar fuera.'
                          : 'Esta oferta todavía no tiene plan de repaso. Se genera con la skill build-interview-review-plan (skills/job-seeking/build-interview-review-plan/SKILL.md) y queda guardado en docs/job-offers/<slug>/interview-review-plan.json.'
                      }
                      onClick={(event) => {
                        if (!selected.hasReviewPlan) event.preventDefault();
                        setMenuOpen(false);
                      }}
                    >
                      Cargar repaso
                    </a>
                    <button
                      type="button"
                      className={`of-menu-item${activeFile() ? '' : ' disabled'}`}
                      disabled={!activeFile()}
                      onClick={handleDownload}
                    >
                      Descargar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              className="of-pane"
              role="tabpanel"
              id={`of-view-pane-${view}`}
              aria-labelledby={`of-view-tab-${view}`}
            >
              {view === 'oferta' && (
                <div className="of-prose" dangerouslySetInnerHTML={{ __html: selected.offerHtml }} />
              )}
              {view === 'cv' &&
                (selected.adaptedResume ? (
                  <AdaptedCvView data={selected.adaptedResume} />
                ) : (
                  <p className="of-empty-line muted tiny">
                    {selected.adaptedResumeInvalid
                      ? 'Hay un adapted-resume.json pero no pasa la validación de schema. Abrilo y corregilo a mano.'
                      : 'Sin adapted-resume.json en la carpeta de la oferta.'}
                  </p>
                ))}
              {view === 'cover' &&
                (selected.coverHtml ? (
                  <div className="of-prose" dangerouslySetInnerHTML={{ __html: selected.coverHtml }} />
                ) : (
                  <p className="of-empty-line muted tiny">
                    Sin cover-letter.md en la carpeta de la oferta.
                  </p>
                ))}
              {view === 'postulacion' && (
                <div>
                  {selected.application ? (
                    <div>
                      <div className="of-row spread">
                        <p className="of-card-title">
                          {selected.empresa} <span className="muted">- {selected.rol}</span>
                        </p>
                        <span
                          className={`of-badge ${BADGE_CLASS[selected.application.estado] ?? 'of-badge-borrador'}`}
                        >
                          {selected.application.estado}
                        </span>
                      </div>
                      <div className="of-meta-grid">
                        <div>
                          <span>Fecha</span>
                          {selected.application.fecha ?? '-'}
                        </div>
                        <div>
                          <span>ATS</span>
                          {selected.application.ats ?? '-'}
                        </div>
                        <div>
                          <span>Score match</span>
                          {selected.matchScore ?? '-'}
                        </div>
                        <div>
                          <span>Salario</span>
                          {selected.salario ?? '-'}
                        </div>
                      </div>
                      {selected.application.outcome && (
                        <p className="of-tiny">
                          <b>Outcome:</b> {selected.application.outcome}
                          {selected.application.outcome_fecha ? ` (${selected.application.outcome_fecha})` : ''}
                        </p>
                      )}
                      {selected.application.motivo && (
                        <p className="of-tiny">
                          <b>Motivo:</b> {selected.application.motivo}
                        </p>
                      )}
                      {selected.application.confirmacion && (
                        <div>
                          <p className="of-tiny muted">Confirmación registrada:</p>
                          <div className="of-quote">{selected.application.confirmacion}</div>
                        </div>
                      )}
                      <p className="of-tiny muted">Documentos:</p>
                      {[selected.application.cv_enviado, selected.application.cover_enviado].filter(Boolean).length >
                      0 ? (
                        <div className="of-row">
                          {[selected.application.cv_enviado, selected.application.cover_enviado]
                            .filter(Boolean)
                            .map((doc) => (
                              <span key={doc} className="chip">
                                {doc}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <p className="of-tiny muted">Sin documentos registrados en application.md.</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="of-card-title">
                        {selected.empresa} <span className="muted">- {selected.rol}</span>
                      </p>
                      <p className="of-empty-line muted tiny">
                        Oferta capturada sin postular: no hay application.md en la carpeta.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="of-empty">
            <p>No hay ofertas para mostrar.</p>
          </div>
        )}
      </div>

      <ProfilePromptModal open={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
}
