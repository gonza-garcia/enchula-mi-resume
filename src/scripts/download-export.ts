import { exportFileName, fileAsName } from '../lib/file-name';
import { stripFrontmatter } from '../lib/frontmatter';
import type { ResumeLocale } from '../schemas/resume';

/**
 * Capa pura del dialogo "Descargar" (Fase H): que se escribe y con que nombre.
 * Sin UI ni DOM — la descarga (blob) y la impresion viven en el dialogo; aca se
 * deciden los nombres, los payloads por documento/formato y el titulo de
 * impresion que sugiere el nombre del PDF (ADR-0036).
 *
 * Formatos por documento (diseno aprobado de la Fase H), en el orden del visor:
 * oferta PDF/TXT · match report MD · CV PDF/DOCX/JSON · cover PDF/MD ·
 * postulacion MD/TXT. El PDF sale por impresion del navegador (ADR-0007,
 * ADR-0032).
 *
 * Nombres (ADR-0036): lo que viaja a un portal o un email (CV y cover) sale con
 * nombre neutro, sin empresa ni rol de la oferta; el registro propio (oferta,
 * match report, postulacion) sale con el nombre literal del archivo.
 */

export type DownloadDoc = 'oferta' | 'report' | 'cv' | 'cover' | 'postulacion';
export type DownloadFormat = 'pdf' | 'docx' | 'json' | 'md' | 'txt';

export interface DownloadDocDef {
  doc: DownloadDoc;
  /** Rotulo del dialogo. */
  label: string;
  /** Nombre literal del archivo (documentos de registro propio). */
  fileName: string;
  /** Nombre del documento dentro del nombre neutro (ADR-0036); null si no aplica. */
  neutralDoc: string | null;
  formats: DownloadFormat[];
}

export const DOWNLOAD_DOCS: DownloadDocDef[] = [
  { doc: 'oferta', label: 'Oferta', fileName: 'offer', neutralDoc: null, formats: ['pdf', 'txt'] },
  { doc: 'report', label: 'Match report', fileName: 'match-report', neutralDoc: null, formats: ['md'] },
  { doc: 'cv', label: 'CV', fileName: 'cv', neutralDoc: 'CV', formats: ['pdf', 'docx', 'json'] },
  { doc: 'cover', label: 'Cover letter', fileName: 'cover-letter', neutralDoc: 'Cover Letter', formats: ['pdf', 'md'] },
  { doc: 'postulacion', label: 'Postulación', fileName: 'application', neutralDoc: null, formats: ['md', 'txt'] }
];

export interface DownloadCtx {
  /** Nombre completo del perfil (para los nombres neutros). */
  name: string;
  /** Idioma del documento (para los nombres neutros). */
  locale: 'en' | 'es';
}

/** Documento del dialogo con su disponibilidad y sus fuentes de datos. */
export interface DownloadItem {
  doc: DownloadDoc;
  /** Disponible: si no, la entrada queda deshabilitada con su hint. */
  enabled: boolean;
  /** Fuente para md/txt: el archivo verbatim. */
  raw?: string;
  /** Fuente para docx/json: la proyeccion del CV o el adapted-resume. */
  cv?: ResumeLocale;
  /** Idioma del documento si difiere del del payload (para el nombre neutro). */
  locale?: 'en' | 'es';
  /** Por que no esta disponible (tooltip de la entrada deshabilitada). */
  hint?: string;
}

/** Payload del evento `download:open`: que ofrece el dialogo y con que datos. */
export interface DownloadPayload {
  /** Nombre completo del perfil (para los nombres neutros). */
  name: string;
  /** Idioma del documento activo. */
  locale: 'en' | 'es';
  /** Documento de la vista activa (el dialogo lo resalta), si lo hay. */
  activeDoc?: DownloadDoc;
  docs: DownloadItem[];
}

function defOf(doc: DownloadDoc): DownloadDocDef {
  const def = DOWNLOAD_DOCS.find((item) => item.doc === doc);
  if (!def) throw new Error(`Documento de descarga desconocido: ${doc}`);
  return def;
}

function requireCtx(doc: DownloadDoc, ctx: DownloadCtx | undefined): DownloadCtx {
  if (!ctx) throw new Error(`El documento "${doc}" necesita nombre del perfil e idioma (DownloadCtx)`);
  return ctx;
}

/** Nombre final del archivo de descarga. */
export function downloadFileName(doc: DownloadDoc, format: DownloadFormat, ctx?: DownloadCtx): string {
  const def = defOf(doc);
  if (!def.neutralDoc) return `${def.fileName}.${format}`;
  const { name, locale } = requireCtx(doc, ctx);
  return exportFileName(name, def.neutralDoc, locale, format);
}

/**
 * Titulo de impresion: el nombre que el dialogo "Guardar como PDF" sugiere para
 * el archivo sale del document.title (ADR-0036), sin extension.
 */
export function downloadPrintTitle(doc: DownloadDoc, ctx?: DownloadCtx): string {
  const def = defOf(doc);
  if (!def.neutralDoc) return def.fileName;
  const { name, locale } = requireCtx(doc, ctx);
  return `${fileAsName(name)} - ${def.neutralDoc} - ${locale.toUpperCase()}`;
}

/**
 * Payload de texto: md es el archivo verbatim (con su frontmatter, es el
 * registro); txt es el cuerpo sin frontmatter, sin resumir ni parafrasear.
 */
export function downloadText(format: 'md' | 'txt', raw: string): string {
  return format === 'md' ? raw : stripFrontmatter(raw);
}

/** Payload JSON del CV (proyeccion del perfil o adapted-resume), legible. */
export function downloadJson(cv: unknown): string {
  return `${JSON.stringify(cv, null, 2)}\n`;
}
