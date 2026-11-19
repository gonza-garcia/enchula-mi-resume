import fs from 'node:fs';
import path from 'node:path';
import {
  interviewCollectionSchema,
  type InterviewCollection
} from '../schemas/interview-collection';
import { listOffers, JOBS_DIR } from './job-offers';

export const COLLECTION_FILE = 'collection.json';
export const COLLECTIONS_DIR = 'src/content/collections';

/**
 * Las colecciones de practica se cargan de las dos ubicaciones del contrato
 * (Fase J), en este orden:
 * - genericas en `src/content/collections/<slug>.json` (viajan al publico);
 * - personales en `docs/job-offers/<slug>/collection.json`, listadas igual que
 *   las ofertas: en un build generico solo entran las de ofertas `demo: true`
 *   (mismo criterio que `loadReviewPlans`, ADR-0035).
 */
export function loadCollections(cwd: string = process.cwd()): InterviewCollection[] {
  const collections: InterviewCollection[] = [];

  const genericDir = path.resolve(cwd, COLLECTIONS_DIR);
  if (fs.existsSync(genericDir)) {
    for (const entry of fs.readdirSync(genericDir).sort()) {
      if (!entry.endsWith('.json')) continue;
      const collection = interviewCollectionSchema.parse(
        JSON.parse(fs.readFileSync(path.join(genericDir, entry), 'utf-8'))
      );
      // El nombre del archivo es el slug de la coleccion (contrato de ubicacion).
      if (entry !== `${collection.slug}.json`) {
        throw new Error(
          `Generic collection file ${entry} must be named ${collection.slug}.json.`
        );
      }
      collections.push(collection);
    }
  }

  for (const offer of listOffers(cwd)) {
    const file = path.resolve(cwd, JOBS_DIR, offer.slug, COLLECTION_FILE);
    if (!fs.existsSync(file)) continue;
    collections.push(interviewCollectionSchema.parse(JSON.parse(fs.readFileSync(file, 'utf-8'))));
  }

  return collections;
}

/** Ids de pregunta del banco que faltan en una coleccion. */
export function missingCollectionQuestionIds(
  collection: InterviewCollection,
  bankQuestionIds: ReadonlySet<string>
): string[] {
  const missing = new Set<string>();
  for (const item of collection.items) {
    for (const questionId of item.questionIds) {
      if (!bankQuestionIds.has(questionId)) missing.add(questionId);
    }
  }
  return Array.from(missing);
}

/**
 * Validacion cruzada con el banco: todo questionId de la coleccion tiene que
 * existir. Falla ruidosamente en build, nombrando el id y la coleccion (mismo
 * criterio que `assertReviewPlanQuestionIds`).
 */
export function assertCollectionQuestionIds(
  collections: InterviewCollection[],
  bankQuestionIds: ReadonlySet<string>
): void {
  for (const collection of collections) {
    const missing = missingCollectionQuestionIds(collection, bankQuestionIds);
    if (missing.length > 0) {
      throw new Error(
        `Collection "${collection.slug}" references unknown question ids: ${missing.join(', ')}.`
      );
    }
  }
}
