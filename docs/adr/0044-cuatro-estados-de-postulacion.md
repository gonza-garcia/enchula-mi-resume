# ADR-0044: Estados de la postulación a cuatro (`borrador` · `enviada` · `confirmada` · `descartada`)

Estado: Vigente.

## Contexto

El contrato de resultado de una postulación (ADR-0042) nació con seis estados:
`borrador | en preparacion | enviada | confirmada | vetada | descartada`. Durante el
diseño de la Fase H (4 nov 2026), usando la app, la persona usuaria pidió simplificarlos.
Los seis estados no distinguían nada que ella usara de verdad, y el paraguas
"Postuladas" del sidebar de `/ofertas` sumaba una cuarta manera de nombrar lo mismo
("Enviada", "Postulada", "Confirmada"): exactamente la confusión que el contrato quería
resolver.

Dos parejas eran el mismo estado con otro nombre:

- `en preparacion` y `borrador` describían lo mismo: la postulación está redactada y
  todavía no se envió.
- `vetada` y `descartada` describían lo mismo: la postulación no se envía y el `motivo`
  (obligatorio) dice por qué. "Vetada" era el nombre que se le daba cuando el motivo era
  una decisión de la persona usuaria, pero la app no tiene por qué saber eso: lo que
  importa es que no se envía y por qué.

## Decisión

1. **El contrato queda con cuatro estados**, en orden de avance:
   - `borrador` — redactada, sin enviar. **Funde el legacy `en preparacion`.**
   - `enviada` — enviada al ATS o al canal de la oferta.
   - `confirmada` — enviada y con la confirmación del ATS registrada en `confirmacion`.
   - `descartada` — no se envía (o no se envió) y `motivo`, obligatorio, dice por qué.
     **Funde el legacy `vetada`.**
2. **`motivo` es obligatorio solo en `descartada`** (antes lo era en `vetada` y en
   `descartada`). Los otros tres estados no lo exigen.
3. **El parser sigue siendo estricto**: un estado legacy rompe el build nombrando el
   archivo. El mapa de migración queda exportado como
   `LEGACY_APPLICATION_STATES` (`src/schemas/application.ts`) como referencia de "de
   dónde venía cada estado", **no** como alias que el parser acepte.
4. **Los filtros de `/ofertas` pierden el paraguas "Postuladas"** y quedan en el orden
   fijo del diseño aprobado: **Todas · Capturadas · Borrador · Enviadas · Confirmadas ·
   Descartadas** (los cuatro estados del contrato en plural, con cuentas exactas).
5. **Backfill de los datos reales** (5 nov 2026): los 4 `application.md` con estado
   legacy de la instancia migraron su `estado` (los otros 28 ya usaban estados del
   contrato). Donde el archivo rotulaba el estado en la prosa (encabezado o línea
   `**Estado:**`) el rótulo se actualizó también; los `motivo` y el resto de la prosa
   quedaron **verbatim**: son la historia de la decisión.

## Alternativas descartadas

- **Aceptar los estados legacy en el parser** (alias tolerantes que los mapean a los
  nuevos): el build dejaría de fallar y un archivo sin migrar quedaría como deuda
  invisible. La regla del contrato es que un dato mal formado rompe el build nombrando
  el archivo, para arreglarlo editando el archivo y no ocultándolo (ADR-0042).
- **Mantener `vetada` como estado** y solo renombrarlo en la UI: dos nombres para el
  mismo concepto entre el schema y la UI, que es el problema que se está resolviendo.
- **Exigir `motivo` en `borrador`** también ("por qué todavía no se envió"): le quitaba
  a `borrador` su sentido de estado de trabajo y obligaba a inventar motivos.
- **Agregar un estado por cada motivo de descarte** (veto, stack gap, ubicación): el
  `motivo` ya es texto libre y obligatorio; el estado dejaría de ser un enum chico y
  navegable.

## Consecuencias

- El vocabulario de resultados queda en cuatro estados + `capturada` para las ofertas
  sin `application.md`. La línea de estado derivado del disco (Agregada · Analizada ·
  Adaptada · Postulada, ADR-0022) no cambia: describe la carpeta, no la postulación.
- Los estados de una **vacante en un barrido** (`nueva | capturada | ya postulada |
  descartada`, ADR-0043) son otro vocabulario, sobre el proceso del barrido, y no se
  tocan acá.
- El sidebar de `/ofertas` queda con 6 filtros fijos y previsibles. Como los conteos
  son facetados (Fase H, H0a), el número de cada filtro es exactamente lo que devuelve
  la lista al activarlo, incluso si es 0.
- Un `application.md` con `estado: vetada` o `estado: en preparacion` rompe el build
  hasta que se migre el archivo: el error nombra el archivo y el fix es editar su
  frontmatter.
