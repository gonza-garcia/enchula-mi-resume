# ADR-0043: Fuentes y barridos del pipeline de búsqueda

Estado: Vigente.

## Contexto

La Fase F dejó a la app mostrando el pipeline de postulaciones (ofertas ->
postulaciones -> perfiles), pero la capa operativa de búsqueda seguía viviendo
fuera del producto: qué fuentes se barren, cómo se busca en cada una, qué se
encontró, qué se capturó y qué se descartó y por qué solo existía en las
herramientas privadas del usuario y en reportes de sesión. La ampliación del
25-oct del workspace de búsqueda incluía "las ofertas como acumulado de barridos
sobre fuentes configurables"; la Fase G la implementa, con estas decisiones de
la persona usuaria (1 nov 2026):

- Las fuentes son de **distinto tipo** (job board, spreadsheet/Excel, email,
  career pages de empresas, listas curadas en redes...) y el sistema debe saber
  **cómo actuar en cada una**: qué herramientas usar, los quirks/mañas conocidos
  y las notas del proceso de captura.
- Cada fuente y cada vacante tienen **id estable**, para que el próximo barrido
  sepa si algo ya se capturó o ya se postuló.
- Cada barrido queda **registrado** (fecha, números, detalle por vacante) y las
  particularidades nuevas del proceso de captura se anotan y mejoran el
  playbook de la fuente.

## Decisión

1. **Una fuente por archivo** en `docs/job-search/sources/<id>.json`, con schema
   Zod (`src/schemas/search-source.ts`) leído por el read model
   (`src/lib/job-search.ts`):
   - `id` (slug estable), `nombre` y `tipo` (**string libre** — el vocabulario
     `job-board | aggregator | company-board | spreadsheet | email | social |
     manual | otro` es sugerido, no un enum: las fuentes nuevas no deben chocar
     con el contrato).
   - `playbook: { buscar, herramientas: [], quirks: [] }`: cómo buscar ahí, qué
     herramientas usar en orden (fetch, Jina Reader, JobSpy, browser-skill...) y
     los quirks/mañas conocidos. Es **dato del usuario**: el mecanismo es
     genérico y el contenido real vive en la instancia.
   - `url?`, `activa?`, `notas?` y `demo` (marca de fuente ficticia).
2. **Un barrido por archivo** en `docs/job-search/sweeps/<YYYY-MM-DD>-<id>.json`,
   con schema Zod (`src/schemas/sweep.ts`):
   - `id`, `fecha`, `fuentes` (resumen por fuente: resultados, nuevas, ya
     capturadas, ya postuladas, descartadas), `vacantes` (detalle con
     `idVacante`, título, empresa, `sourceId`, estado `nueva | capturada | ya
     capturada | ya postulada | descartada`, `motivo?` requerido para
     descartadas, `slug?` de la carpeta), `capturadas` (slugs) y
     `particularidades` (aprendizajes que actualizan el playbook de la fuente).
3. **Ids estables**: `id` corto por fuente; `id_vacante` por vacante (job id
   externo cuando existe — LinkedIn/Greenhouse/Lever/Ashby — o hash estable de
   la URL o `empresa + título`). El frontmatter de `offer.md` suma `fuente`,
   `barrido` e `id_vacante` opcionales. El cruce contra lo ya hecho dialoga con
   el chequeo de duplicados del ADR-0038 (`url`/`url_alternativa`, contenido,
   `application.md`).
4. **Demo vs real, mismo patrón que las ofertas**: los archivos llevan `demo:
   true` si son ficticios; en un build de producción solo entran los demo
   (`offersSource()`), y los reales (catálogo de fuentes del usuario, barridos
   y sus descartes) son dato del usuario que **nunca viaja al staging ni al repo
   público**.
5. **La UI tiene página propia `/fuentes`** (quinto destino de la navbar): el
   listado de fuentes con tipo, playbook resumido, ofertas históricas por fuente
   y stats; la sección "Barridos" vive en `/ofertas` con el historial por
   barrido y el detalle de descartes con motivo.

## Consecuencias

- Los vetos/descartes previos a la captura (que hoy solo viven en reportes
  privados) pasan a tener lugar en el producto, dentro del registro del barrido
  que los encontró.
- El playbook por fuente se mejora con cada barrido (particularidades -> notas
  de la fuente), con lo que las mañas de extracción dejan de vivir solo en la
  memoria de las sesiones.
- La ejecución de un barrido queda **fuera del producto**: es operación del
  agente con las herramientas privadas de búsqueda. El producto registra y
  muestra; no barre solo. Si en el futuro se automatiza, este ADR se revisa.
- `capture-job-offer` sigue siendo la dueña del contrato de carpetas; acepta
  `fuente`/`barrido`/`id_vacante` en el frontmatter y la skill `register-sweep`
  es la dueña del contrato de barridos.
