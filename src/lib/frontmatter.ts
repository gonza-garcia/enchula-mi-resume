/**
 * Frontmatter YAML de los documentos markdown de una oferta (offer.md,
 * match-report.md, cover-letter.md, application.md). Sin dependencias de node:
 * la capa de export del dialogo "Descargar" lo usa tambien desde el navegador.
 */

/** Cuerpo del markdown sin el frontmatter inicial (el archivo sin encabezado). */
export function stripFrontmatter(raw: string): string {
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}
