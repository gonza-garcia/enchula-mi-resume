import { z } from 'astro/zod';
import { localizedTextSchema } from './interview-questions';

const nonEmptyString = z.string().min(1);
const kebabId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Expected kebab-case id');

export const interviewCollectionItemSchema = z
  .object({
    /** Id estable del item en kebab-case, unico dentro de la coleccion. */
    id: kebabId,
    /** Nota del ejercicio / tema de practica del item. Puede no tener. */
    note: localizedTextSchema.nullable(),
    /** Ids completos de preguntas existentes del banco (minimo una). */
    questionIds: z.array(nonEmptyString).min(1)
  })
  .superRefine((item, ctx) => {
    const seen = new Set<string>();
    for (const [index, questionId] of item.questionIds.entries()) {
      if (seen.has(questionId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['questionIds', index],
          message: `Duplicate question id "${questionId}"`
        });
      }
      seen.add(questionId);
    }
  });

/**
 * Contrato de una coleccion de practica (Fase J): lista curada de items con sus
 * notas de ejercicio y sus ids de pregunta del banco, para cargar en /interview.
 *
 * Vive en dos ubicaciones segun la regla de privacidad:
 * - generica (sin nombres reales): `src/content/collections/<slug>.json`, viaja
 *   al repo publico;
 * - personal / que nombra empresas reales: `docs/job-offers/<slug>/collection.json`,
 *   nunca viaja al publico ni entra a un build generico.
 *
 * No toca el contrato del banco ni el de los planes de repaso (ADR-0035): solo
 * referencia ids de pregunta existentes y no tiene marcas propias (la practica
 * usa `interview-progress`).
 */
export const interviewCollectionSchema = z
  .object({
    /** Slug de la coleccion: identifica el deep link `?coleccion=<slug>`. */
    slug: kebabId,
    /** Titulo visible de la coleccion, bilingue como el banco (ADR-0046). */
    title: localizedTextSchema,
    /** Ejercicios de la coleccion, en orden. */
    items: z.array(interviewCollectionItemSchema).min(1)
  })
  .superRefine((collection, ctx) => {
    const seen = new Set<string>();
    for (const [index, item] of collection.items.entries()) {
      if (seen.has(item.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'id'],
          message: `Duplicate item id "${item.id}"`
        });
      }
      seen.add(item.id);
    }
  });

export type InterviewCollectionItem = z.infer<typeof interviewCollectionItemSchema>;
export type InterviewCollection = z.infer<typeof interviewCollectionSchema>;
