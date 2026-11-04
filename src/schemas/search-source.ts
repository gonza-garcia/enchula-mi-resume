import { z } from 'zod';

/**
 * Contrato de fuentes de ofertas (Fase G, ADR-0043): una fuente es cualquier
 * lugar donde se buscan vacantes (job board, spreadsheet, email, career page...)
 * y lleva su playbook de extraccion: como buscar ahi, que herramientas usar y
 * los quirks/manas conocidos. El contenido real es dato del usuario (vive en la
 * instancia); solo las fuentes demo viajan al producto generico.
 */
export const sourceSchema = z.object({
  /** Id estable y corto de la fuente (slug): lo referencian barridos y ofertas. */
  id: z.string().min(1),
  nombre: z.string().min(1),
  /**
   * Tipo de fuente: string libre a proposito (job-board, aggregator,
   * company-board, spreadsheet, email, social, manual...). El vocabulario es
   * sugerido, no un enum cerrado: las fuentes nuevas no deben chocar con el
   * contrato.
   */
  tipo: z.string().min(1),
  url: z.string().min(1).nullable().optional(),
  /** Fuente inactiva: se conserva por su historial pero no se barre. */
  activa: z.boolean().optional(),
  /**
   * Fuente prioritaria del usuario (empresas que le gustan y donde tiene gente
   * que puede referir): se barren primero y sus vacantes se senalan en el
   * reporte del barrido.
   */
  prioridad: z.boolean().optional(),
  /** Fuente ficticia de demostracion: la unica que entra en un build publicable. */
  demo: z.boolean().optional(),
  /** Como actuar en esta fuente para encontrar y capturar vacantes. */
  playbook: z.object({
    /** Como buscar las vacantes ahi (url/query/filtro). */
    buscar: z.string().min(1),
    /** Herramientas a usar en orden (fetch, Jina Reader, JobSpy, bsk...). */
    herramientas: z.array(z.string().min(1)),
    /** Quirks/manas conocidos (authwalls, render JS, rate limits, leads viejos...). */
    quirks: z.array(z.string().min(1))
  }),
  notas: z.string().min(1).nullable().optional()
});

export type SearchSource = z.infer<typeof sourceSchema>;
