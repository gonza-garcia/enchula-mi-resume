# ADR-0045: Retiro del puente de prompts — la app se opera con un agente corriendo las skills

Estado: Vigente. Declara **obsoleto** al ADR-0023 (puente de prompts para escribir
archivos y verificación por endpoint).

## Contexto

El ADR-0023 resolvía que el sitio es estático y no puede escribir en disco con un
puente de prompts: el usuario copiaba un prompt de la app, lo pasaba a un agente
externo, pegaba el output JSON de vuelta en la app (que validaba con Zod y componía
los archivos) y el agente escribía esos archivos verbatim guiado por un prompt de
guardado. El mismo patrón alimentaba captura de ofertas, análisis y adaptación,
perfil, plan de estudios, "+ Agregar perfil" y el modal de LinkedIn.

Durante la Fase H (alcance revisado el 6 nov 2026) la persona usuaria cerró la
decisión que lo reemplaza: **la app se opera sí o sí con un agente de IA corriendo
las skills del repo**. No queda ningún flujo de "copiar el prompt / pegar el output"
en ninguna parte de la app: la skill hace el trabajo y escribe los archivos ella
misma, validando en build. Lo que la app muestra es lo que hay en disco.

## Decisión

1. **El ADR-0023 queda obsoleto en su totalidad**: el prompt compuesto por pasos, el
   modal de IA de dos columnas (prompt / output pegado), el modal de guardado con
   verificación por endpoint, el template editable de "analizar a mano", el parseo
   heurístico de texto pegado del formulario de captura y el fallback de descarga
   manual como vía del flujo. El código de esos puentes se borró en la Fase H
   (`src/islands/offers-manager/` entero, ~1200 líneas, H1c; "+ Agregar perfil",
   H1d) y con la H1e se fueron el export y el diálogo de LinkedIn, la otra
   superficie de copiar/pegar que quedaba en la app.
2. **Las skills quedan solo en modo directo**: cada skill escribe sus archivos y
   valida en build. Sus documentaciones de "modo app" (devolver un JSON para pegar
   en la app) se retiraron junto con este ADR; el contrato de cada skill es su
   sección "Contrato y límites".
3. **`/api/job-offers.json` sigue existiendo** como listado de solo lectura de las
   ofertas capturadas, pero pierde el rol de verificación que le daba el puente: no
   hay nada que verificar, porque la escritura la hace la skill y el build la
   valida.

## Alternativas descartadas

- **Mantener el puente como fallback sin agente**: dos vías para escribir lo mismo,
  con dos contratos de validación; la vía muerta se pudre en silencio (justo lo que
  pasó con el "modo app" de las skills).
- **Agente integrado en la app**: es investigación aparte (ver "Futuro: agente de
  IA integrado en la app" del roadmap) con restricciones propias; no reemplaza la
  operación por skills.

## Consecuencias

- Operar el pipeline completo (capturar, analizar, adaptar, cover letter, plan de
  repaso, barridos, perfil) requiere un agente corriendo las skills del repo; la
  app es la superficie de lectura, revisión y seguimiento de lo que hay en disco.
- Queda como historia, sin superficie vigente: ADR-0021 (isla React del gestor de
  ofertas) y ADR-0040 (tabs "CVs base"/"CVs adaptados") describen UI borrada en la
  H1c; ADR-0023 queda marcado como obsoleto desde este ADR.
- Si algún material viejo (guías, prompts, notas) todavía describe el flujo de
  copiar/pegar, eso es legado: el flujo real es correr la skill.
