import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { sourceSchema, type SearchSource } from '../schemas/search-source';
import { sweepSchema, type Sweep } from '../schemas/sweep';
import { offersSource } from './job-offers';

/**
 * Read model de fuentes y barridos (Fase G, ADR-0043). Una fuente por archivo
 * en `docs/job-search/sources/` y un barrido por archivo en
 * `docs/job-search/sweeps/`, igual que una carpeta por oferta: el estado vive
 * en disco y la app lista exactamente lo que hay. Los archivos invalidos fallan
 * ruidosamente nombrando el archivo.
 */

export const SEARCH_DIR = 'docs/job-search';
export const SOURCES_DIR = 'sources';
export const SWEEPS_DIR = 'sweeps';

function readJsonDir<T>(
  cwd: string,
  dir: string,
  parse: (raw: string, source: string) => T
): T[] {
  const root = path.resolve(cwd, SEARCH_DIR, dir);
  if (!fs.existsSync(root)) return [];
  const items: T[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const file = path.join(root, entry.name);
    items.push(parse(fs.readFileSync(file, 'utf-8'), path.posix.join(SEARCH_DIR, dir, entry.name)));
  }
  return items;
}

function parseJson<T extends z.ZodType>(
  schema: T,
  raw: string,
  source: string,
  label: string
): z.infer<T> {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(`${label} invalido en ${source}: JSON mal formado`);
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => `${issue.path.join('.') || '(raiz)'}: ${issue.message}`).join('; ');
    throw new Error(`${label} invalido en ${source}: ${detail}`);
  }
  return parsed.data;
}

export function parseSearchSource(raw: string, source: string): SearchSource {
  return parseJson(sourceSchema, raw, source, 'fuente');
}

export function parseSweep(raw: string, source: string): Sweep {
  return parseJson(sweepSchema, raw, source, 'barrido');
}

/** Fuentes configuradas. En build demo solo entran las marcadas con `demo: true`. */
export function listSources(cwd: string = process.cwd()): SearchSource[] {
  const source = offersSource();
  return readJsonDir(cwd, SOURCES_DIR, parseSearchSource).filter(
    (item) => source === 'local' || item.demo === true
  );
}

/** Barridos registrados, del mas reciente al mas viejo. */
export function listSweeps(cwd: string = process.cwd()): Sweep[] {
  const source = offersSource();
  return readJsonDir(cwd, SWEEPS_DIR, parseSweep)
    .filter((item) => source === 'local' || item.demo === true)
    .sort((a, b) => (a.fecha === b.fecha ? b.id.localeCompare(a.id) : b.fecha.localeCompare(a.fecha)));
}
