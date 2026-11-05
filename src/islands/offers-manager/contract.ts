import { z } from 'zod';
import { resumeSchema, type Resume } from '../../schemas/resume';
import type { OfferListing, OfferMeta, OfferState, CoverLetterFile } from '../../lib/job-offers';

export type { OfferListing, OfferMeta, OfferState, CoverLetterFile };

/** Chip de estado de la postulacion (application.md): pills solo para etiquetas. */
export const POST_BADGE_CLASS: Record<string, string> = {
  borrador: 'of-badge-borrador',
  enviada: 'of-badge-enviada',
  confirmada: 'of-badge-confirmada',
  descartada: 'of-badge-descartada'
};

export interface OfferView {
  listing: OfferListing;
  offerHtml: string;
  reportHtml: string | null;
  adaptedResume: Resume | null;
  coverLetter: CoverLetterFile | null;
}

export interface CaptureJson {
  empresa: string;
  rol: string;
  fecha: string;
  url: string | null;
  modalidad: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  location: string | null;
  salario?: string | null;
  recruiter?: string | null;
  /** Ids de posicionamientos del perfil a los que apunta la oferta (opcional, multi-perfil). */
  perfiles?: string[] | null;
  descripcion_empresa: string | null;
  oferta_texto: string;
}

export interface AnalysisJson {
  match_score: number;
  match_fuerte: string[];
  gaps_parciales: string[];
  gaps_reales: string[];
  ajustes_recomendados: string[];
  temas_entrevista: string[];
  score_explicacion: string;
}

export const captureJsonSchema = z.object({
  empresa: z.string().min(1),
  rol: z.string().min(1),
  fecha: z.string().min(1),
  url: z.string().nullable(),
  modalidad: z.enum(['remote', 'hybrid', 'onsite', 'unknown']),
  location: z.string().nullable(),
  salario: z.string().nullable().optional(),
  recruiter: z.string().nullable().optional(),
  perfiles: z.array(z.string().min(1)).nullable().optional(),
  descripcion_empresa: z.string().nullable(),
  oferta_texto: z.string().min(1)
});

export const analysisJsonSchema = z.object({
  match_score: z.number().min(0).max(100),
  match_fuerte: z.array(z.string()),
  gaps_parciales: z.array(z.string()),
  gaps_reales: z.array(z.string()),
  ajustes_recomendados: z.array(z.string()),
  temas_entrevista: z.array(z.string()),
  score_explicacion: z.string()
});

/** Extrae el primer bloque JSON fence de un texto y lo parsea. */
export function extractFencedJson(raw: string): unknown {
  const match = raw.match(/```json\r?\n([\s\S]*?)```/);
  if (!match) throw new Error('No hay un bloque ```json en el texto pegado.');
  return JSON.parse(match[1]);
}

export function parseCapture(raw: string): CaptureJson {
  return captureJsonSchema.parse(extractFencedJson(raw));
}

export function parseAnalysis(raw: string): AnalysisJson {
  return analysisJsonSchema.parse(extractFencedJson(raw));
}

export function parseAdaptedResume(raw: string): Resume {
  return resumeSchema.parse(extractFencedJson(raw));
}

export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildSlug(empresa: string, rol: string, fecha: string): string {
  return `${fecha}-${slugify(empresa)}-${slugify(rol)}`;
}

export function slugWithCollision(
  base: string,
  taken: string[]
): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function cleanForMd(raw: string): string {
  return raw
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2192/g, ' a ')
    .replace(/\u2190/g, ' desde ')
    .replace(/\u2194/g, ' y ')
    .replace(/\u21d2/g, ' implica ');
}

export function composeOfferMd(
  meta: CaptureJson,
  ofertaTexto?: string
): string {
  const texto = cleanForMd((ofertaTexto ?? meta.oferta_texto).trim());
  return [
    '---',
    `empresa: ${meta.empresa}`,
    `rol: ${meta.rol}`,
    `fecha: ${meta.fecha}`,
    `url: ${meta.url ? meta.url : 'N/A'}`,
    `modalidad: ${meta.modalidad}`,
    `location: ${meta.location ?? 'N/A'}`,
    `salario: ${meta.salario ?? 'N/A'}`,
    `recruiter: ${meta.recruiter ?? 'N/A'}`,
    ...(meta.perfiles && meta.perfiles.length > 0
      ? [`perfiles: ${meta.perfiles.map((id) => id.trim()).filter(Boolean).join(', ')}`]
      : []),
    '---',
    '',
    '# Oferta original',
    '',
    texto,
    ''
  ].join('\n');
}

export function composeMatchReport(analysis: AnalysisJson): string {
  const lines: string[] = [
    '---',
    `match_score: ${analysis.match_score}`,
    '---',
    '',
    '# An\u00e1lisis de match',
    '',
    '## Match fuerte (ten\u00e9s y se pide)',
    '',
    ...analysis.match_fuerte.map((item) => `- ${item}`),
    '',
    '## Gap parcial (ten\u00e9s pero no exacto)',
    '',
    ...analysis.gaps_parciales.map((item) => `- ${item}`),
    '',
    '## Gap real (no ten\u00e9s y se pide)',
    '',
    ...analysis.gaps_reales.map((item) => `- ${item}`),
    '',
    '## Ajustes recomendados para el CV adaptado',
    '',
    ...analysis.ajustes_recomendados.map((item, i) => `${i + 1}. ${item}`),
    '',
    '## Temas a repasar para la entrevista',
    '',
    ...analysis.temas_entrevista.map((item) => `- ${item}`),
    '',
    `## Score: ${analysis.match_score}/100`,
    '',
    analysis.score_explicacion.trim(),
    ''
  ];
  return lines.join('\n');
}

export interface OfferFormValues {
  url: string;
  fecha: string;
  empresa: string;
  rol: string;
  ofertaTexto: string;
  modalidad: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  location: string;
  descripcionEmpresa: string;
  salario: string;
  recruiter: string;
  seniority: string;
  stack: string;
  /** Ids de posicionamientos separados por coma (ej: frontend, ai). */
  perfiles: string;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Parseo heuristico de texto plano pegado (email, Slack, WhatsApp):
 * busca etiquetas comunes en el texto y completa lo que puede.
 */
export function parsePlainOffer(text: string): Partial<OfferFormValues> {
  const result: Partial<OfferFormValues> = {};
  const patterns: [keyof OfferFormValues, RegExp][] = [
    ['empresa', /^(?:empresa|company|compa[^\n]*?)\s*[:\-]\s*(.+)$/im],
    ['rol', /^(?:rol|puesto|posici[^\n]*?|cargo|title)\s*[:\-]\s*(.+)$/im],
    ['location', /^(?:ubicaci[^\n]*?|lugar|location)\s*[:\-]\s*(.+)$/im],
    ['salario', /^(?:salario|remuneraci[^\n]*?|sueldo)\s*[:\-]\s*(.+)$/im],
    ['recruiter', /^(?:recruiter|contacto|contacto de recruiter|responsable)\s*[:\-]\s*(.+)$/im],
    ['seniority', /^(?:seniority|nivel|seniority requerido)\s*[:\-]\s*(.+)$/im],
    ['stack', /^(?:stack|tecnolog[^\n]*?)\s*[:\-]\s*(.+)$/im]
  ];
  for (const [key, re] of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      (result as Record<string, string | undefined>)[key] = m[1].trim();
    }
  }
  const modality = text.match(/\b(remote|remoto|h[ií]brido|hybrid|onsite|presencial)\b/i);
  if (modality) {
    const v = modality[1].toLowerCase();
    result.modalidad = /^(remote|remoto)$/i.test(v)
      ? 'remote'
      : /^(h[ií]brido|hybrid)$/i.test(v)
        ? 'hybrid'
        : 'onsite';
  }
  const url = text.match(/https?:\/\/\S+/);
  if (url) result.url = url[0];
  result.ofertaTexto = text;
  return result;
}

export function estadoLabel(estado: OfferState): string {
  if (estado === 'adaptada') return 'CV adaptado \u2713';
  if (estado === 'analizada') return 'Analizada \u2713';
  return 'Agregada';
}
