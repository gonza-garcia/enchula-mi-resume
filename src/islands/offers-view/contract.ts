import type { Resume } from '../../schemas/resume';
import type { Application, ApplicationState } from '../../schemas/application';
import type { Sweep } from '../../schemas/sweep';
import type { OfferState } from '../../lib/job-offers';

export type { Application, ApplicationState, OfferState, Sweep };

/**
 * Fila de la vista "Ofertas" (Fase F, variante D): la data de la carpeta de la
 * oferta ya leida y serializada en build, lista para filtrar y mostrar.
 */
export interface OfferRow {
  slug: string;
  empresa: string;
  rol: string;
  /** Fecha de captura (frontmatter de offer.md). */
  fecha: string;
  url: string | null;
  modalidad: string;
  location: string | null;
  salario: string | null;
  recruiter: string | null;
  /** Posicionamientos (perfiles) declarados en offer.md (`perfiles: frontend, ai`). */
  perfiles: string[];
  /** Vinculo con el pipeline de busqueda (Fase G): fuente, barrido e id de vacante. */
  fuente: string | null;
  barrido: string | null;
  idVacante: string | null;
  /** Estado derivado del disco: agregada | analizada | adaptada. */
  estado: OfferState;
  matchScore: number | null;
  hasReviewPlan: boolean;
  /** Resultado de la postulacion (application.md), si existe. */
  application: Application | null;
  offerHtml: string;
  offerRaw: string;
  coverHtml: string | null;
  coverRaw: string | null;
  adaptedResume: Resume | null;
  /** Hay adapted-resume.json pero no pasa el schema: se avisa en el visor. */
  adaptedResumeInvalid: boolean;
  adaptedRaw: string | null;
  applicationRaw: string | null;
}

export interface ProfilePositioning {
  id: string;
  title: string;
}

/** Fuente de busqueda, proyectada para el filtro del sidebar (Fase G). */
export interface SourceRef {
  id: string;
  nombre: string;
}

export interface OffersViewProps {
  rows: OfferRow[];
  positionings: ProfilePositioning[];
  /** Fuentes configuradas, para rotular el filtro por fuente. */
  sources: SourceRef[];
}

/** Estados de la barra lateral de "Estado" (ademas de los del contrato). */
export type EstadoFilter = 'todas' | 'capturadas' | 'postuladas' | ApplicationState;

export const ESTADO_FILTERS: EstadoFilter[] = ['todas', 'capturadas', 'postuladas'];

export type ViewerView = 'oferta' | 'cv' | 'cover' | 'postulacion';

export const VIEWER_VIEWS: { key: ViewerView; label: string }[] = [
  { key: 'oferta', label: 'Oferta original' },
  { key: 'cv', label: 'CV adaptado' },
  { key: 'cover', label: 'Cover letter' },
  { key: 'postulacion', label: 'Postulación' }
];
