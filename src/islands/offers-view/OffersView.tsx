import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { EstadoFilter, OfferRow, OffersViewProps, ViewerView } from './contract';
import { ESTADO_FILTERS, VIEWER_VIEWS } from './contract';
import type { DownloadPayload } from '../../scripts/download-export';
import AdaptedCvView from './AdaptedCvView';

const BADGE_CLASS: Record<string, string> = {
  borrador: 'of-badge-borrador',
  enviada: 'of-badge-enviada',
  confirmada: 'of-badge-confirmada',
  descartada: 'of-badge-descartada',
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

/* ---- Predicados de filtro: una sola definicion para la lista y los conteos ----
   Antes de la H0 los conteos se calculaban sobre todas las filas mientras que la
   lista aplicaba los filtros: en cuanto habia un filtro de perfil, fuente o score
   activo, los numeros del sidebar dejaban de describir la lista (4-nov-2026:
   "Todas 64" con 12 cards a la vista y filtros de estado con cuenta positiva y
   lista vacia). Compartir los predicados hace que el numero de un filtro sea
   exactamente lo que devuelve la lista al activarlo. */

function matchEstado(row: OfferRow, filter: EstadoFilter): boolean {
  if (filter === 'todas') return true;
  if (filter === 'capturadas') return !row.application;
  return row.application?.estado === filter;
}

function matchPerfil(row: OfferRow, perfil: string | null): boolean {
  if (!perfil) return true;
  return row.perfiles.some((id) => id.toLowerCase() === perfil);
}

function matchFuente(row: OfferRow, fuente: string | null): boolean {
  if (!fuente) return true;
  if (fuente === SIN_FUENTE) return !row.fuente;
  return row.fuente === fuente;
}

function matchTop(row: OfferRow, onlyTop: boolean): boolean {
  return !onlyTop || (row.matchScore ?? 0) >= TOP_MATCH;
}

/** Grupo de filtros colapsable del sidebar (H0c). */
function FilterGroup({
  id,
  title,
  open,
  onToggle,
  children
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="of-group">
      <button
        type="button"
        className="of-sec of-sec-toggle"
        aria-expanded={open}
        aria-controls={`of-grupo-${id}`}
        onClick={onToggle}
      >
        <span className={`of-chevron${open ? ' open' : ''}`} aria-hidden="true">
          &#8250;
        </span>
        <span>{title}</span>
      </button>
      <div id={`of-grupo-${id}`} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

/**
 * Paneles redimensionables (Tanda H2d): anchos de panel en px, con clamps y
 * persistencia en localStorage. 816px = 8.5in, el ancho de la hoja del CV de
 * Mis Perfiles (Layout.astro): el default del visor es el ancho del CV.
 */
const SIDE_WIDTH_KEY = 'ofertas.sidebar-width';
const VIEWER_WIDTH_KEY = 'ofertas.viewer-width';
const SIDE_WIDTH = { min: 140, max: 320, def: 180 };
const VIEWER_WIDTH = { min: 340, max: 1100, def: 816 };

function clampWidth(limits: { min: number; max: number }, width: number): number {
  return Math.min(limits.max, Math.max(limits.min, width));
}

function readStoredWidth(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

type PanelId = 'side' | 'viewer';

/**
 * Vista "Ofertas" (Fase F, variante D): sidebar de filtros, cards compactas y
 * visor a la derecha con las 5 vistas. La data llega ya leida del build (las
 * carpetas de docs/job-offers); aca solo se filtra y se muestra. Sin seguimiento
 * ni acciones de envio: el Submit de cualquier postulacion lo aprieta el usuario.
 */
export default function OffersView({ rows, positionings, sources, profileName }: OffersViewProps) {
  const [estado, setEstado] = useState<EstadoFilter>('todas');
  const [perfil, setPerfil] = useState<string | null>(null);
  const [fuente, setFuente] = useState<string | null>(null);
  const [topMatches, setTopMatches] = useState(false);
  // Grupos del sidebar colapsables (H0c): Estado y Perfil abiertos, que son los
  // filtros de todos los dias; Fuente y Score colapsados, porque el listado de
  // fuentes es largo y el corte de score es un solo toggle. Un grupo con un
  // filtro activo se fuerza abierto: nunca se pierde un filtro puesto.
  const [grupos, setGrupos] = useState<Record<string, boolean>>({
    estado: true,
    perfil: true,
    fuente: false,
    score: false
  });
  const toggleGrupo = (id: string) => setGrupos((prev) => ({ ...prev, [id]: !prev[id] }));
  const grupoAbierto = (id: string, conFiltroActivo: boolean) => grupos[id] || conFiltroActivo;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [view, setView] = useState<ViewerView>('oferta');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Paneles redimensionables (Tanda H2d): dos splitters (sidebar <-> feed y
  // feed <-> visor) que mueven las vars --of-side-w / --of-viewer-w del shell,
  // con clamps y persistencia en localStorage. Los anchos guardados se leen al
  // montar (no en el render: el SSR no tiene localStorage). El ancho durante el
  // drag se toma de la geometria renderizada, para que el handle siga al puntero
  // aunque la columna este pisada por su minimo.
  const sideRef = useRef<HTMLElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [panelWidths, setPanelWidths] = useState<Record<PanelId, number>>({
    side: SIDE_WIDTH.def,
    viewer: VIEWER_WIDTH.def
  });
  const [dragging, setDragging] = useState<PanelId | null>(null);
  const dragRef = useRef<{ target: PanelId; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    setPanelWidths({
      side: readStoredWidth(SIDE_WIDTH_KEY, SIDE_WIDTH.def),
      viewer: readStoredWidth(VIEWER_WIDTH_KEY, VIEWER_WIDTH.def)
    });
  }, []);

  const panelWidth = (target: PanelId): number => {
    const el = target === 'side' ? sideRef.current : viewerRef.current;
    return el ? el.getBoundingClientRect().width : 0;
  };

  const applyWidth = (target: PanelId, width: number, persist: boolean): void => {
    const clamped = Math.round(clampWidth(target === 'side' ? SIDE_WIDTH : VIEWER_WIDTH, width));
    setPanelWidths((prev) => ({ ...prev, [target]: clamped }));
    if (persist) {
      try {
        window.localStorage.setItem(target === 'side' ? SIDE_WIDTH_KEY : VIEWER_WIDTH_KEY, String(clamped));
      } catch {
        /* sin localStorage no hay persistencia: los defaults siguen andando */
      }
    }
  };

  const widthForDrag = (
    drag: { target: PanelId; startX: number; startWidth: number },
    clientX: number
  ): number => {
    const delta = clientX - drag.startX;
    // El visor se mide desde su borde izquierdo: mover el handle a la izquierda lo agranda.
    return drag.target === 'side' ? drag.startWidth + delta : drag.startWidth - delta;
  };

  const startDrag = (target: PanelId) => (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = { target, startX: event.clientX, startWidth: panelWidth(target) };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(target);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (!drag) return;
    applyWidth(drag.target, widthForDrag(drag, event.clientX), false);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragging(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
    applyWidth(drag.target, widthForDrag(drag, event.clientX), true);
  };

  // Las flechas redimensionan el panel controlado: derecha = mas ancho
  // (aria-valuenow es ese ancho), Shift multiplica el paso por 3.
  const onSplitterKey = (target: PanelId) => (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const step = (event.shiftKey ? 48 : 16) * (event.key === 'ArrowRight' ? 1 : -1);
    applyWidth(target, panelWidth(target) + step, true);
  };

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

  /**
   * Conteos facetados (H0a): cada dimension se cuenta sobre las filas que pasan
   * los OTROS filtros activos, nunca sobre `rows` a secas. Es lo que hace que el
   * numero que va junto a un filtro sea exactamente la cantidad de cards que
   * aparecen al activarlo ("cuentas exactas").
   */
  const counts = useMemo(() => {
    const withoutEstado = rows.filter(
      (row) => matchPerfil(row, perfil) && matchFuente(row, fuente) && matchTop(row, topMatches)
    );
    const byState = new Map<string, number>();
    let capturadas = 0;
    for (const row of withoutEstado) {
      if (row.application) {
        byState.set(row.application.estado, (byState.get(row.application.estado) ?? 0) + 1);
      } else {
        capturadas += 1;
      }
    }

    const byPerfil = new Map<string, number>();
    for (const row of rows) {
      if (!matchEstado(row, estado) || !matchFuente(row, fuente) || !matchTop(row, topMatches)) continue;
      for (const id of row.perfiles) {
        const key = id.toLowerCase();
        byPerfil.set(key, (byPerfil.get(key) ?? 0) + 1);
      }
    }

    const byFuente = new Map<string, number>();
    let sinFuente = 0;
    for (const row of rows) {
      if (!matchEstado(row, estado) || !matchPerfil(row, perfil) || !matchTop(row, topMatches)) continue;
      if (row.fuente) byFuente.set(row.fuente, (byFuente.get(row.fuente) ?? 0) + 1);
      else sinFuente += 1;
    }

    let top = 0;
    for (const row of rows) {
      if (!matchEstado(row, estado) || !matchPerfil(row, perfil) || !matchFuente(row, fuente)) continue;
      if ((row.matchScore ?? 0) >= TOP_MATCH) top += 1;
    }

    return {
      todas: withoutEstado.length,
      capturadas,
      top,
      byState,
      byPerfil,
      byFuente,
      sinFuente
    };
  }, [rows, estado, perfil, fuente, topMatches]);

  /**
   * El sidebar de Estado es la lista fija del diseno aprobado (H0b): Todas ·
   * Capturadas · Borrador · Enviadas · Confirmadas · Descartadas. Los conteos ya
   * son facetados (H0a), asi que el numero de cada entrada es exactamente lo que
   * devuelve la lista al activarla, incluso si es 0.
   */

  const visible = useMemo(() => {
    const filtered = rows.filter(
      (row) =>
        matchEstado(row, estado) &&
        matchPerfil(row, perfil) &&
        matchFuente(row, fuente) &&
        matchTop(row, topMatches)
    );
    // Orden default del feed: fecha de captura descendente, con el orden del read
    // model (mismo dia: slug descendente) como desempate estable. Antes las
    // postuladas se colaban primero y el feed no era directamente la cronologia.
    return filtered;
  }, [rows, estado, perfil, fuente, topMatches]);

  const selected = visible.find((row) => row.slug === selectedSlug) ?? visible[0] ?? null;

  /**
   * Deep link `?oferta=<slug>` (H1b): reemplaza el `?tab=adaptados&oferta=` del
   * gestor de ofertas, que se retira. Es lo que `/fuentes` usa para enlazar a la
   * oferta concreta que salio de cada fuente.
   */
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('oferta');
    if (slug) setSelectedSlug(slug);
  }, []);

  const selectOffer = (slug: string) => {
    setSelectedSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set('oferta', slug);
    window.history.replaceState({}, '', url);
  };

  const countForEstado = (filter: EstadoFilter): number => {
    if (filter === 'todas') return counts.todas;
    if (filter === 'capturadas') return counts.capturadas;
    return counts.byState.get(filter) ?? 0;
  };

  const perfilTitle = (id: string): string =>
    positionings.find((positioning) => positioning.id.toLowerCase() === id.toLowerCase())?.title ?? id;

  // "Descargar" del menu (Tanda H3c): abre el dialogo reutilizable con el set
  // completo de la oferta, preseleccionando la vista activa del visor. Los
  // documentos sin archivo quedan deshabilitados con el mismo texto de vacio
  // del visor.
  const openDownload = () => {
    setMenuOpen(false);
    if (!selected) return;
    const cv = selected.adaptedResume ? (selected.adaptedResume.en ?? selected.adaptedResume.es) : undefined;
    const cvLocale: 'en' | 'es' = selected.adaptedResume?.en ? 'en' : 'es';
    const detail: DownloadPayload = {
      name: profileName,
      locale: cvLocale,
      activeDoc: view,
      docs: [
        { doc: 'oferta', enabled: true, raw: selected.offerRaw },
        {
          doc: 'report',
          enabled: Boolean(selected.reportRaw),
          raw: selected.reportRaw ?? undefined,
          hint: 'Sin match-report.md en la carpeta de la oferta.'
        },
        {
          doc: 'cv',
          enabled: Boolean(cv),
          cv,
          hint: selected.adaptedResumeInvalid
            ? 'Hay un adapted-resume.json pero no pasa la validación de schema. Abrilo y corregilo a mano.'
            : 'Sin adapted-resume.json en la carpeta de la oferta.'
        },
        {
          doc: 'cover',
          enabled: Boolean(selected.coverRaw),
          raw: selected.coverRaw ?? undefined,
          locale: selected.coverLocale ?? undefined,
          hint: 'Sin cover-letter.md en la carpeta de la oferta.'
        },
        {
          doc: 'postulacion',
          enabled: Boolean(selected.applicationRaw),
          raw: selected.applicationRaw ?? undefined,
          hint: 'Oferta capturada sin postular: no hay application.md en la carpeta.'
        }
      ]
    };
    window.dispatchEvent(new CustomEvent('download:open', { detail }));
  };

  // Handle de resize entre dos paneles (Tanda H2d): separador vertical
  // focusable, con drag (pointer capture) y flechas del teclado.
  const renderSplitter = (target: PanelId, label: string) => (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-controls={target === 'side' ? 'of-side' : 'of-viewer'}
      aria-valuenow={panelWidths[target]}
      aria-valuemin={target === 'side' ? SIDE_WIDTH.min : VIEWER_WIDTH.min}
      aria-valuemax={target === 'side' ? SIDE_WIDTH.max : VIEWER_WIDTH.max}
      tabIndex={0}
      className={`of-splitter${dragging === target ? ' dragging' : ''}`}
      data-split={target}
      onPointerDown={startDrag(target)}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onSplitterKey(target)}
    />
  );

  return (
    <div
      className="of-shell"
      style={
        {
          '--of-side-w': `${panelWidths.side}px`,
          '--of-viewer-w': `${panelWidths.viewer}px`
        } as CSSProperties
      }
    >
      <aside className="of-side" id="of-side" ref={sideRef} aria-label="Filtros de ofertas">
        <FilterGroup
          id="estado"
          title="Estado"
          open={grupoAbierto('estado', estado !== 'todas')}
          onToggle={() => toggleGrupo('estado')}
        >
          {ESTADO_FILTERS.map((entry) => (
            <button
              key={entry.key}
              type="button"
              className={`of-item${estado === entry.key ? ' on' : ''}`}
              aria-pressed={estado === entry.key}
              onClick={() => setEstado(entry.key)}
            >
              <span>{entry.label}</span>
              <span className="of-count">{countForEstado(entry.key)}</span>
            </button>
          ))}
        </FilterGroup>

        <FilterGroup
          id="perfil"
          title="Perfil"
          open={grupoAbierto('perfil', perfil !== null)}
          onToggle={() => toggleGrupo('perfil')}
        >
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
        </FilterGroup>

        <FilterGroup
          id="fuente"
          title="Fuente"
          open={grupoAbierto('fuente', fuente !== null)}
          onToggle={() => toggleGrupo('fuente')}
        >
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
        </FilterGroup>

        <FilterGroup
          id="score"
          title="Score"
          open={grupoAbierto('score', topMatches)}
          onToggle={() => toggleGrupo('score')}
        >
          <button
            type="button"
            className={`of-item${topMatches ? ' on' : ''}`}
            aria-pressed={topMatches}
            onClick={() => setTopMatches(!topMatches)}
          >
            <span>Top matches (&ge; {TOP_MATCH})</span>
            <span className="of-count">{counts.top}</span>
          </button>
        </FilterGroup>
      </aside>

      {renderSplitter('side', 'Redimensionar el panel de filtros')}

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
                onClick={() => selectOffer(row.slug)}
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

      {renderSplitter('viewer', 'Redimensionar el visor')}

      <div className="of-viewer" id="of-viewer" ref={viewerRef}>
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
                    <button type="button" className="of-menu-item" onClick={openDownload}>
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
              {view === 'report' &&
                (selected.reportHtml ? (
                  <div className="of-prose" dangerouslySetInnerHTML={{ __html: selected.reportHtml }} />
                ) : (
                  <p className="of-empty-line muted tiny">
                    Sin match-report.md en la carpeta de la oferta.
                  </p>
                ))}
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
                  {(selected.url || selected.urlAlternativas.length > 0) && (
                    <div>
                      <p className="of-tiny muted">Oferta publicada:</p>
                      <div className="of-row">
                        {selected.url && (
                          <a
                            className="btn secondary"
                            href={selected.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            title={selected.url}
                          >
                            Abrir oferta
                          </a>
                        )}
                        {selected.urlAlternativas.map((link, index) => (
                          <a
                            key={link.url}
                            className="btn secondary"
                            href={link.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            title={link.url}
                          >
                            Abrir alternativa
                            {selected.urlAlternativas.length > 1 ? ` ${index + 1}` : ''}
                          </a>
                        ))}
                      </div>
                      {selected.urlAlternativas.map((link) =>
                        link.nota ? (
                          <p key={link.url} className="of-tiny muted">
                            {link.nota}
                          </p>
                        ) : null
                      )}
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

      {/* Copias de impresion (Tanda H3c): el PDF del dialogo "Descargar" emite
          por print solo el documento elegido (body[data-print-doc]), sin mover
          la vista del visor. Mismo markup que las vistas: WYSIWYG con el DOCX. */}
      <div className="of-print-set">
        {selected && (
          <div className="of-print-copy" data-print-copy="oferta">
            <div className="of-prose" dangerouslySetInnerHTML={{ __html: selected.offerHtml }} />
          </div>
        )}
        {selected?.adaptedResume && (
          <div className="of-print-copy" data-print-copy="cv">
            <AdaptedCvView data={selected.adaptedResume} />
          </div>
        )}
        {selected?.coverHtml && (
          <div className="of-print-copy" data-print-copy="cover">
            <div className="of-prose" dangerouslySetInnerHTML={{ __html: selected.coverHtml }} />
          </div>
        )}
      </div>
    </div>
  );
}
