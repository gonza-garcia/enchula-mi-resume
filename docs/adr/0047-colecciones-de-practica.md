# ADR-0047: Colecciones de práctica

Estado: Vigente.

## Contexto

La práctica para entrevistas no siempre es por oferta ni por área: también se arma por
proceso («las preguntas de la ronda de entrevistas de una empresa»), por tema («las que
siempre me traban») y por ejercicio («esto salió en una entrevista concreta»). El patrón
probado de los planes de repaso (ADR-0035) — una lista curada de ids del banco que se
carga en `/interview` — resuelve el mecanismo, pero el plan de repaso es por oferta, con
su metadata (empresa, rol, match score) y sus marcas propias por tema. Hacía falta un
ciudadano de primera para listas curadas de práctica sin esa dependencia de una oferta.

Restricción de fondo: una colección puede nombrar empresas reales (es el material de una
entrevista concreta) y eso no puede viajar al repo público ni entrar a un build genérico
(ADR-0033), mientras que las colecciones genéricas sí son producto y viajan.

## Decisión

1. **Contrato JSON de colección** (`interviewCollectionSchema` en
   `src/schemas/interview-collection.ts`, validado en build): `slug`, `title` bilingüe
   `{en, es}` e `items` en orden. Cada item: `id` kebab-case único dentro de la colección,
   `note` bilingüe opcional (nullable) con el tema del ejercicio y `questionIds` con ids
   **completos** del banco (mínimo uno, sin repetidos). Sin `empresa`/`rol`/`matchScore`:
   eso es del plan de repaso.
2. **Dos ubicaciones, por privacidad**:
   - Genérica (no nombra empresas reales): `src/content/collections/<slug>.json` — el
     nombre del archivo es el slug — y viaja al repo público.
   - Personal (puede nombrar empresas reales): `docs/job-offers/<slug-de-oferta>/collection.json`.
     No viaja al público y no entra a un build genérico: se lista con el mismo filtro demo
     que las ofertas y los planes de repaso (`loadReviewPlans`, ADR-0035).
3. **Validación cruzada con el banco en build** (mismo criterio que ADR-0035): todo
   `questionId` tiene que existir en el banco; un id desconocido rompe el build nombrando
   el id y la colección. El contrato del banco no se toca: la colección solo referencia
   ids existentes y no agrega preguntas.
4. **UI en `/interview`**: sección «Colecciones» en el sidebar (junto a las áreas) con los
   títulos. Al elegir una, el listado se filtra a sus ids y se muestra un panel tipo repaso
   con los ejercicios y sus notas. Deep link `?coleccion=<slug>`. La selección es estado de
   la vista (`interview-ui-state`, campo `collectionSlug` aditivo) y sobrevive al MPA de
   Astro como el resto de los filtros.
5. **Sin sistema de marcas nuevo**: la práctica usa el progreso por pregunta existente
   (`interview-progress`: sin-marcar / se / repasar), visible en los chips del panel. El
   contrato de los planes de repaso (ADR-0035) no se toca.

## Consecuencias

- El contenido de una colección personal vive al lado de su oferta y su ciclo de vida es
  el de la carpeta: al borrar la oferta se va su colección.
- Una colección genérica es contenido de producto como el banco: se cura con ids del banco
  y pasa por la misma validación en build.
