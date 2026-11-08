import fs from 'node:fs';
import path from 'node:path';
import { applicationSchema, type Application } from '../schemas/application';
import { stripFrontmatter } from './frontmatter';

export { stripFrontmatter };

export type OfferState = 'agregada' | 'analizada' | 'adaptada';

/**
 * Link a la oferta publicada. `url_alternativa` puede aparecer repetido en el
 * frontmatter (el contrato lo permite: son las otras URLs del mismo aviso que
 * encuentra el chequeo de duplicados) y cada valor puede traer una nota despues
 * de la URL, que se conserva como texto.
 */
export interface OfertaLink {
  url: string;
  nota: string | null;
}

export interface OfferMeta {
  empresa: string;
  rol: string;
  fecha: string;
  url: string | null;
  /** Otras URLs del mismo aviso (`url_alternativa`, repetible en el frontmatter). */
  urlAlternativas: OfertaLink[];
  modalidad: string;
  location: string | null;
  salario: string | null;
  recruiter: string | null;
  /**
   * Posicionamientos (perfiles) a los que apunta la oferta, ids separados por
   * coma en el frontmatter de `offer.md` (`perfiles: frontend, ai`). Campo
   * opcional y multi-perfil: sin el campo, la oferta no se asigna a ningun
   * perfil y solo aparece en "Todas".
   */
  perfiles: string[];
  /**
   * Vinculo con el pipeline de busqueda (Fase G, ADR-0043): id de la fuente de
   * la que salio la oferta (`fuente`), id del barrido que la capturo (`barrido`)
   * e id estable de la vacante (`id_vacante`, job id externo o hash de la URL)
   * para deduplicar contra barridos futuros. Opcionales: las ofertas sin
   * vinculo siguen funcionando igual.
   */
  fuente: string | null;
  barrido: string | null;
  idVacante: string | null;
}

export interface OfferListing {
  slug: string;
  meta: OfferMeta;
  estado: OfferState;
  /** Oferta ficticia de demostracion: la unica que entra en un build publicable. */
  demo: boolean;
  hasOffer: boolean;
  hasReport: boolean;
  hasAdapted: boolean;
  hasCoverLetter: boolean;
  hasReviewPlan: boolean;
  matchScore: number | null;
  /** Resultado de la postulacion (`application.md`), si existe en la carpeta. */
  hasApplication: boolean;
  application: Application | null;
}

export const JOBS_DIR = 'docs/job-offers';
export const OFFER_FILE = 'offer.md';
export const REPORT_FILE = 'match-report.md';
export const ADAPTED_FILE = 'adapted-resume.json';
export const COVER_LETTER_FILE = 'cover-letter.md';
export const REVIEW_PLAN_FILE = 'interview-review-plan.json';
export const APPLICATION_FILE = 'application.md';

/**
 * Que ofertas entran en el listado. En dev se ve todo: es la app viva con los
 * datos reales del usuario. En un build de produccion solo entran las ofertas
 * demo (ficticias), salvo que se pida explicitamente OFFERS_SOURCE=local, que es
 * lo que usan `pnpm run build:personal` y la suite E2E.
 */
export function offersSource(): 'demo' | 'local' {
  const explicit = process.env.OFFERS_SOURCE;
  if (explicit === 'local' || explicit === 'demo') return explicit;
  return import.meta.env.DEV ? 'local' : 'demo';
}

/** Oferta ficticia de demostracion: se marca con `demo: true` en el frontmatter. */
export function isDemoOffer(raw: string): boolean {
  return (parseFrontmatter(raw).demo || '').toLowerCase() === 'true';
}

/** Cover letter ya guardada por la skill, lista para mostrar. */
export interface CoverLetterFile {
  subject: string | null;
  letter: string;
  locale: 'en' | 'es';
}

export function parseCoverLetterFile(raw: string): CoverLetterFile {
  const fm = parseFrontmatter(raw);
  return {
    subject: fm.subject && fm.subject !== 'N/A' ? fm.subject : null,
    letter: stripFrontmatter(raw).trim(),
    locale: fm.locale === 'es' ? 'es' : 'en'
  };
}

function parseFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fm: Record<string, string> = {};
  if (!match) return fm;
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) fm[key] = value;
  }
  return fm;
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

/**
 * Ids de posicionamiento del frontmatter `perfiles` (separados por coma o en
 * lista entre corchetes). Tolera espacios, ids repetidos y el campo ausente.
 */
export function parsePerfilesField(value: string | undefined): string[] {
  if (!value) return [];
  const ids = value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);
  return Array.from(new Set(ids));
}

/**
 * Links `url_alternativa` del frontmatter: el contrato los permite repetidos (son
 * las otras URLs del mismo aviso que encuentra el chequeo de duplicados) y cada
 * valor puede traer una nota despues de la URL, entre parentesis o suelta. Un
 * valor que no empieza con http no es link y se ignora.
 */
export function parseUrlAlternativas(raw: string): OfertaLink[] {
  const block = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!block) return [];
  const links: OfertaLink[] = [];
  for (const line of block[1].split(/\r?\n/)) {
    if (!/^url_alternativa\s*:/.test(line)) continue;
    const value = line.slice(line.indexOf(':') + 1).trim();
    const match = value.match(/^(\S+)(?:\s+(.*))?$/);
    if (!match || !/^https?:\/\//i.test(match[1])) continue;
    const nota = (match[2] ?? '').replace(/^\(/, '').replace(/\)$/, '').trim();
    links.push({ url: match[1], nota: nota || null });
  }
  return links;
}

function metaFromOfferMd(slug: string, raw: string): OfferMeta {
  const fm = parseFrontmatter(raw);
  return {
    empresa: fm.empresa || 'Unknown',
    rol: fm.rol || 'Unknown',
    fecha: fm.fecha || slug.slice(0, 10),
    url: fm.url && fm.url !== 'N/A' ? fm.url : null,
    urlAlternativas: parseUrlAlternativas(raw),
    modalidad: fm.modalidad || 'unknown',
    location: fm.location || null,
    salario: fm.salario && fm.salario !== 'N/A' ? fm.salario : null,
    recruiter: fm.recruiter && fm.recruiter !== 'N/A' ? fm.recruiter : null,
    perfiles: parsePerfilesField(fm.perfiles),
    fuente: cleanFrontmatterValue(fm.fuente),
    barrido: cleanFrontmatterValue(fm.barrido),
    idVacante: cleanFrontmatterValue(fm.id_vacante)
  };
}

/** Valores legacy o sin dato que se normalizan a null. */
function cleanFrontmatterValue(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower === 'n/a' || lower === 'pendiente') return null;
  return trimmed;
}

/**
 * Parsea y valida el `application.md` de una oferta (contrato de resultado de la
 * Fase F, con los 4 estados de la Fase H, ADR-0044). Falla ruidosamente nombrando
 * el archivo si el estado no es del contrato o si falta el motivo de un descarte.
 * `fecha_envio` es alias legacy de `fecha`.
 */
export function parseApplicationFile(raw: string, source: string): Application {
  const fm = parseFrontmatter(raw);
  const candidate = {
    empresa: cleanFrontmatterValue(fm.empresa) ?? '',
    rol: cleanFrontmatterValue(fm.rol) ?? '',
    fecha: cleanFrontmatterValue(fm.fecha) ?? cleanFrontmatterValue(fm.fecha_envio),
    estado: (fm.estado ?? '').trim().toLowerCase(),
    motivo: cleanFrontmatterValue(fm.motivo),
    ats: cleanFrontmatterValue(fm.ats),
    confirmacion: cleanFrontmatterValue(fm.confirmacion),
    cv_enviado: cleanFrontmatterValue(fm.cv_enviado),
    cover_enviado: cleanFrontmatterValue(fm.cover_enviado),
    outcome: cleanFrontmatterValue(fm.outcome),
    outcome_fecha: cleanFrontmatterValue(fm.outcome_fecha)
  };
  const parsed = applicationSchema.safeParse(candidate);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`);
    throw new Error(`application.md invalido en ${source}: ${issues.join(' | ')}`);
  }
  return parsed.data;
}

/** Lista fisica de ofertas en docs/job-offers con estado derivado del disco. */
export function listOffers(cwd: string = process.cwd()): OfferListing[] {
  const root = path.resolve(cwd, JOBS_DIR);
  if (!fs.existsSync(root)) return [];

  const source = offersSource();
  const offers: OfferListing[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const slug = entry.name;
    const dir = path.join(root, slug);

    const hasOffer = fs.existsSync(path.join(dir, OFFER_FILE));
    if (!hasOffer) continue;

    const raw = fs.readFileSync(path.join(dir, OFFER_FILE), 'utf-8');
    const demo = isDemoOffer(raw);
    if (source === 'demo' && !demo) continue;

    const hasReport = fs.existsSync(path.join(dir, REPORT_FILE));
    const hasAdapted = fs.existsSync(path.join(dir, ADAPTED_FILE));
    const hasCoverLetter = fs.existsSync(path.join(dir, COVER_LETTER_FILE));
    const hasReviewPlan = fs.existsSync(path.join(dir, REVIEW_PLAN_FILE));

    const estado: OfferState = hasAdapted && hasReport
      ? 'adaptada'
      : hasReport
        ? 'analizada'
        : 'agregada';

    let matchScore: number | null = null;
    if (hasReport) {
      const fm = parseFrontmatter(fs.readFileSync(path.join(dir, REPORT_FILE), 'utf-8'));
      const parsed = parseInt(fm.match_score || '', 10);
      if (Number.isFinite(parsed)) matchScore = parsed;
    }

    const applicationPath = path.join(dir, APPLICATION_FILE);
    const hasApplication = fs.existsSync(applicationPath);
    const application = hasApplication
      ? parseApplicationFile(
          fs.readFileSync(applicationPath, 'utf-8'),
          path.posix.join(JOBS_DIR, slug, APPLICATION_FILE)
        )
      : null;

    offers.push({
      slug,
      meta: metaFromOfferMd(slug, raw),
      estado,
      demo,
      hasOffer,
      hasReport,
      hasAdapted,
      hasCoverLetter,
      hasReviewPlan,
      matchScore,
      hasApplication,
      application
    });
  }

  offers.sort(
    (a, b) => b.meta.fecha.localeCompare(a.meta.fecha) || b.slug.localeCompare(a.slug)
  );
  return offers;
}

export interface OfferDetail {
  slug: string;
  offerRaw: string;
  reportRaw: string | null;
  adaptedResume: unknown | null;
  /** Texto crudo del adapted-resume.json (para la vista y la descarga). */
  adaptedRaw: string | null;
  coverLetterRaw: string | null;
  applicationRaw: string | null;
}

/** Contenido completo de una oferta para el render del split-view. */
export function readOfferDetail(slug: string, cwd: string = process.cwd()): OfferDetail | null {
  const dir = path.resolve(cwd, JOBS_DIR, slug);
  if (!fs.existsSync(path.join(dir, OFFER_FILE))) return null;
  const offerRaw = fs.readFileSync(path.join(dir, OFFER_FILE), 'utf-8');
  const reportPath = path.join(dir, REPORT_FILE);
  const adaptedPath = path.join(dir, ADAPTED_FILE);
  const coverLetterPath = path.join(dir, COVER_LETTER_FILE);
  const applicationPath = path.join(dir, APPLICATION_FILE);
  const reportRaw = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, 'utf-8') : null;
  let adaptedResume: unknown = null;
  let adaptedRaw: string | null = null;
  if (fs.existsSync(adaptedPath)) {
    adaptedRaw = fs.readFileSync(adaptedPath, 'utf-8');
    try {
      adaptedResume = JSON.parse(adaptedRaw);
    } catch {
      adaptedResume = null;
    }
  }
  const coverLetterRaw = fs.existsSync(coverLetterPath)
    ? fs.readFileSync(coverLetterPath, 'utf-8')
    : null;
  const applicationRaw = fs.existsSync(applicationPath)
    ? fs.readFileSync(applicationPath, 'utf-8')
    : null;
  return { slug, offerRaw, reportRaw, adaptedResume, adaptedRaw, coverLetterRaw, applicationRaw };
}
