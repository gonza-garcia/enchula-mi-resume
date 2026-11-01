import { z } from 'zod';

/**
 * Contrato de barridos (Fase G, ADR-0043): un barrido es el registro de una
 * pasada de busqueda sobre fuentes — que se vio, que se capturo, que se
 * descarto y por que, y las particularidades nuevas del proceso de captura que
 * alimentan el playbook de la fuente. Los ids de vacante permiten que el
 * proximo barrido sepa si algo ya se capturo o ya se postulo (dialoga con el
 * chequeo de duplicados del ADR-0038).
 */

/** Estado de una vacante encontrada en un barrido. */
export const SWEEP_VACANCY_STATES = [
  'nueva',
  'capturada',
  'ya capturada',
  'ya postulada',
  'descartada'
] as const;

const optionalText = z.string().min(1).nullable().optional();

/** Vacante encontrada en el barrido, con su id estable y su estado. */
export const sweepVacancySchema = z.object({
  /** Id estable de la vacante: job id externo o hash de la URL / empresa+titulo. */
  idVacante: z.string().min(1),
  titulo: z.string().min(1),
  empresa: optionalText,
  sourceId: z.string().min(1),
  estado: z.enum(SWEEP_VACANCY_STATES),
  /** Razon del descarte. Requerido cuando el estado es `descartada`. */
  motivo: optionalText,
  /** Slug de la carpeta de la oferta, cuando quedo capturada o ya existia. */
  slug: optionalText
});

/** Resumen por fuente barrida. */
export const sweepSourceSummarySchema = z.object({
  sourceId: z.string().min(1),
  resultados: z.number().int().nonnegative().optional(),
  nuevas: z.number().int().nonnegative().optional(),
  yaCapturadas: z.number().int().nonnegative().optional(),
  yaPostuladas: z.number().int().nonnegative().optional(),
  descartadas: z.number().int().nonnegative().optional()
});

export const sweepSchema = z
  .object({
    /** Id del barrido: `<YYYY-MM-DD>-<corto>` (ej. `2026-11-01-wad`). */
    id: z.string().min(1),
    fecha: z.string().min(1),
    /** Barrido ficticio de demostracion: el unico que entra en un build publicable. */
    demo: z.boolean().optional(),
    fuentes: z.array(sweepSourceSummarySchema),
    vacantes: z.array(sweepVacancySchema),
    /** Slugs de las ofertas capturadas en este barrido. */
    capturadas: z.array(z.string().min(1)),
    /** Particularidades nuevas del proceso de captura: alimentan el playbook. */
    particularidades: z.array(z.string().min(1))
  })
  .superRefine((sweep, ctx) => {
    for (const [index, vacante] of sweep.vacantes.entries()) {
      if (vacante.estado === 'descartada' && !vacante.motivo) {
        ctx.addIssue({
          code: 'custom',
          path: ['vacantes', index, 'motivo'],
          message: 'motivo es requerido cuando la vacante esta descartada'
        });
      }
    }
  });

export type Sweep = z.infer<typeof sweepSchema>;
export type SweepVacancy = z.infer<typeof sweepVacancySchema>;
export type SweepSourceSummary = z.infer<typeof sweepSourceSummarySchema>;
