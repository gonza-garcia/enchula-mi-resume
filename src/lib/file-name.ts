/**
 * Nombre de archivo neutro para los documentos que el usuario sube o adjunta en
 * postulaciones (CV y cover letter). El nombre se arma con el nombre completo
 * del perfil, apellidos primero y sin acentos ni caracteres especiales: un
 * nombre con la empresa o el rol de la oferta delata que el documento fue
 * adaptado para esa postulacion (ADR-0036).
 *
 * Lo reimplementa el dialogo "Descargar" de la Fase H: la H1e retiro la capa de
 * export entera y el ADR-0036 quedo sin superficie hasta ahora.
 */

export function fileAsName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const ordered = parts.length > 1 ? [...parts.slice(1), parts[0]] : parts;
  return ordered
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Nombre de export: `<apellidos> <nombres> - <documento> - <LOCALE>.<ext>`. */
export function exportFileName(name: string, doc: string, locale: string, ext: string): string {
  return `${fileAsName(name)} - ${doc} - ${locale.toUpperCase()}.${ext}`;
}
