# Enchula mi Resume

Producto de CV e interview prep: un sitio Astro estático, bilingüe, ATS friendly, con gestor
de ofertas, banco de preguntas y plan de estudios navegable. Cualquier usuario clona el repo,
un agente lo entrevista para armar su perfil y el build cae en una demo ficticia si todavía no
cargó datos.

Este documento es el readme de producto: estado, decisiones de producto, onboarding, deploy y
protocolo de salida. La documentación personal de su autora vive en su repo privado de planning y no
forma parte del producto.

## Estado actual

- El CV principal se renderiza desde la proyección del perfil: `src/content/profile.json` si
  existe y, si no, el contenido demo ficticio de `src/content/profile.example.json`
  (ADR-0026). El perfil es la fuente única de datos, en capas: identidad, hechos, skills como
  entidad y posicionamientos.
- El contenido base tiene dos locales: `es` y `en`. La UI de las islas queda en español.
- El sitio es Astro 7 (upgrade documentado en ADR-0020). "Mis perfiles" (`/`) fusiona el
  CV base canónico imprimible (estático vanilla) con los CVs adaptados en dos tabs, y
  aloja la isla React del gestor de ofertas en su tab "CVs adaptados"; `/ofertas` es la
  vista de resultados del pipeline y `/interview` y `/learning` son islas React
  (ADR-0021, ADR-0024, ADR-0029, ADR-0040 y ADR-0042). La navbar de 4 destinos
  ("Mis perfiles", "Ofertas", "Prep entrevistas" y "Plan de estudios") es la misma en
  todas las páginas y se estila como links con subrayado (ADR-0040 y ADR-0042).
- `/interview` publica el banco de prep de entrevistas en inglés, con filtros por área, nivel,
  rol y frecuencia, un "Filtro" de texto sobre las tarjetas y una búsqueda global con ranking
  (área > título > respuesta), preguntas trampa, quizzes y escenarios de código. El contenido
  se valida con Zod durante el build y los bloques de código se pre-renderizan con Shiki. El
  banco está reorganizado en áreas 1:1 con las fases del plan (ADR-0030).
- `/learning` navega el plan de estudios por fases, con progreso por recurso, gate por fase,
  panel de perfil frente al plan y enlaces bidireccionales con `/interview` (ADR-0028 y
  ADR-0029).
- Cada oferta vive en su carpeta `docs/job-offers/<slug>/` con `offer.md` (con `perfiles`
  opcional en el frontmatter: los posicionamientos del perfil a los que apunta),
  `match-report.md`, `adapted-resume.json` y, cuando hubo postulación, `application.md`
  (el registro con su estado, motivo, confirmación del ATS y documentos); el estado se
  deriva del disco: Agregada, Analizada, Adaptada y Postulada (ADR-0022 y ADR-0042). El
  repo lleva dos ofertas demo ficticias (Aurora Labs y Nimbus Software) como fixtures del
  producto; en una instancia propia, las ofertas reales del usuario quedan fuera de git.
- El gestor de ofertas, en la tab "CVs adaptados" de "Mis perfiles", lista exactamente lo
  que hay en disco y sus flujos de creación usan el puente de prompts con las skills del
  repo (ADR-0023).
- Las skills del flujo viven en `skills/job-seeking/`: `build-profile`, `capture-job-offer`,
  `adapt-resume-to-offer`, `research-content`, `content-designer`, `capture-learning-plan`
  y `build-interview-review-plan`.
- Cada oferta puede llevar un plan de repaso (`interview-review-plan.json`, ADR-0035) que
  `build-interview-review-plan` genera cruzando los "Temas a repasar" del match-report
  contra el banco. La tab "CVs adaptados" ofrece "Cargar repaso" por oferta (navega a
  `/interview`) y `/interview` lo carga con confirmación (AlertDialog) y toast, con marcas
  por tema y filtro opcional al repaso, sin tocar `interview-progress`.

## Fuente de verdad

El perfil (`src/content/profile.json`, schema Zod en `src/schemas/profile.ts`) es la fuente
única de datos del CV. El build carga el profile local si existe y cae al ejemplo ficticio
`src/content/profile.example.json` si no. La validación ocurre en build y falla ruidosamente
con datos mal formados (ids de skill o de bullet huérfanos, campos sin los dos locales, ids
duplicados).

La página `/` y el export JSON renderizan y descargan la proyección activa del perfil
(posicionamiento más locale), calculada en `src/lib/profile-projection.ts`. El brand y el
título PDF salen del perfil. `/learning` consume el read model del perfil
(`src/lib/profile-read-model.ts`).

`src/content/resume.json` dejó de ser fuente: es contenido heredado que puede usarse como
material de la entrevista de `build-profile`, y la salida al repo público lo retira
(ADR-0027). No editar ese archivo esperando cambios en el sitio.

El plan de estudios vive en `src/content/learning-plan.json` (dato del usuario: nunca viaja al
repo público) con su ejemplo commiteado `src/content/learning-plan.example.json` y su schema en
`src/schemas/learning-plan.ts` (ADR-0028).

No duplicar el contenido del CV en README, ADRs o documentos de ofertas. Esos archivos
explican decisiones, contexto y restricciones. Si hay una diferencia, el perfil validado y la
decisión vigente de este README tienen prioridad sobre el texto histórico de un ADR.

## Onboarding: de clonar a CV maestro

1. Clonar el repo, `pnpm install` y `pnpm run dev`: se ve el CV demo ficticio funcionando sin
   datos personales.
2. Ejecutar la skill `build-profile` (`skills/job-seeking/build-profile/SKILL.md`) en modo
   directo. La entrevista cubre identidad, hechos (experiencia, educación, certificaciones,
   idiomas y proyectos), skills como entidad y los posicionamientos, con cada campo de texto
   en es y en. El perfil se guarda en `src/content/profile.json` (dato del usuario: nunca
   viaja al repo público) y se valida con
   `pnpm run build`.
3. Opcional: `capture-learning-plan` escribe `src/content/learning-plan.json` con el plan de
   estudios propio.
4. Verificar con `pnpm run check && pnpm run build && pnpm run test`.

En modo app (prompt de la app o de un agente externo), las skills devuelven el JSON para
pegar y guardar después, con el mismo destino.

## Decisiones vigentes

### Formato y arquitectura

- Astro 7 genera HTML, CSS y JavaScript estáticos.
- El CV principal mantiene interactividad vanilla. La isla del gestor de ofertas vive en
  la tab "CVs adaptados" de "Mis CVs" y las páginas `/interview` y `/learning` usan islas
  React porque administran estados y flujos de interacción más complejos (ADR-0040).
- El layout principal es single column para mantener la lectura ATS.
- La experiencia laboral se renderiza en formato ATS-safe, revisión v4 (ADR-0039): una
  entrada por empleo en tres líneas (rol, empresa, fechas del empleo); las asignaciones por
  cliente se renderizan como bloques `Client: <cliente> (<años>) | descriptor` dentro de la
  descripción, con bullets de carácter literal (`•`, `-`) y nombres en la convención
  `Marca cliente - descriptor`; y la línea de contacto va en texto plano sin links.
- El toggle de idioma, los exports y el panel de tema funcionan del lado cliente.
- El PDF se genera con `window.print()` y CSS de impresión, sin una librería de PDF.
- La impresión conserva el accent elegido para headings y URLs, con texto y fondo claros para
  mantener legibilidad y parsing.
- `/interview` mantiene UI en español y contenido del banco en inglés. El progreso de estudio
  se persiste en `localStorage` con claves propias (`interview-progress`) y se exporta/importa
  como JSON versionado validado con Zod.
- `/interview` usa shadcn/ui en su isla (ADR-0034): filtrado facetado estricto (selección
  vacía = 0 resultados), árbol de áreas con "Todas las áreas", checkbox por grupo con estado
  indeterminado y plegado, y búsqueda global (⌘K) con ranking área > título de pregunta >
  respuesta y acciones por resultado. Las secciones "Preguntas trampa" y "Mis notas" van
  contraídas por defecto ("Mis notas" abre si hay una nota guardada).

### Producto genérico (decisión de #26)

- El perfil del usuario es la fuente única de datos, en capas: identidad, hechos, skills como
  entidad y posicionamientos. `/` renderiza la proyección del perfil (posicionamiento más
  locale) y el export JSON descarga esa proyección (ADR-0026).
- El perfil lleva además un `backlog` de experiencias en reserva: fragmentos listos para CV con
  su prueba y su techo (`proof` y `limits`), que no se renderizan mientras están en `reserve`.
  Se promueven a un CV adaptado por decisión de la persona usuaria, o al CV base
  materializándolos en hechos (ADR-0031).
- El build carga el profile local si existe y cae al `profile.example.json` si no. El contenido
  demo es siempre ficticio (persona y empresas inventadas).
- El plan de estudios es un contrato JSON propio con la demanda colgada de la skill y no del
  curso (ADR-0028).
- El onboarding de un usuario nuevo es la skill de agente `build-profile`, con modo app y modo
  directo. El camino de clonar a CV maestro está documentado arriba.
- La salida al repo público sigue el protocolo del ADR-0027.

### Página `/learning` (ADR-0029, ADR-0030 y ADR-0041)

- `/learning` navega el plan por fases ordenadas por los roles que habilitan, con recursos
  mapeados por skill a la demanda del mercado, marcas de progreso por recurso (hecho, en curso,
  skipped), gate por fase, panel de perfil frente al plan (cubiertas, gaps por presencia,
  prioridades por demanda dentro del orden de fases y sugerencias desde hechos) y material de
  investigación como lista de lectura ordenada, fuera del contrato y del perfil.
- Los gates se presentan citando evidencia, nunca inventando estado (ADR-0041): un gate con
  citas (`gateEvidence`: commit / URL / archivo, con label, fecha y fuente) se muestra como
  "cumplido con evidencia citada" y no se marca a mano; sin citas, el gate se marca a mano y
  el resumen desglosa "con evidencia citada" y "marcados a mano". El estado se deriva de las
  citas: el contrato del plan no tiene ningún boolean de estado.
- El contenido del plan es bilingüe es/en por campo con ambos obligatorios; se renderiza según
  el toggle del sitio y la UI queda en español.
- El progreso del plan es dato del usuario: clave propia `learning-progress` en `localStorage`,
  export/import versionado validado con Zod, sobre un módulo de persistencia compartido con
  `/interview` (`src/lib/progress-storage.ts`).
- `/learning` e `/interview` quedan conectadas con enlaces de datos bidireccionales y quizzes
  por fase, sobre el banco reorganizado en áreas 1:1 con las fases (los id de pregunta se
  conservan para no perder el progreso guardado).

### Página "Mis perfiles" (ADR-0040 y ADR-0042)

- "Mis perfiles" (antes "Mis CVs") vive en `/` con tabs "CVs base" (default) y "CVs
  adaptados". El CV base canónico imprimible sigue en `/`: sin JavaScript se renderiza el
  CV base y el print emite solo el documento activo (el chrome de tabs y cards no se
  imprime). Los posicionamientos del perfil son los perfiles (Frontend, Frontend AI, y
  los que se agreguen).
- La tab "CVs base" tiene cards por posicionamiento como selector (título, resumen y
  acciones "Imprimir PDF" / "Exportar") con el CV activo debajo; reemplazan al toggle
  del toolbar, que queda con idioma / export / tema.
- La tab "CVs adaptados" aloja el gestor de ofertas con sus cards por oferta y el estado
  derivado del disco (ADR-0022 sin cambios). Las cards con `application.md` llevan el
  chip de estado de la postulación y el panel muestra la sección "Postulación" (estado,
  motivo, confirmación del ATS, outcome y documentos; mensaje neutro sin acciones cuando
  no hay registro).
- La ruta `/adapted` ya no existe: el deep link canónico es `/?tab=adaptados` (se acepta
  también `?tab=adapted`) y con `&oferta=<slug>` selecciona la oferta pedida. El
  back-link del gestor es "← CVs base" y activa la tab.
- Navbar consistente de 4 destinos ("Mis perfiles" · "Ofertas" · "Prep entrevistas" ·
  "Plan de estudios") en todas las páginas, desde el componente compartido `SiteNav`,
  como links con subrayado. El Toolbar completo (idioma / export / tema) vive solo en
  "Mis perfiles"; `/ofertas`, `/interview` y `/learning` conservan la barra slim.
- El diálogo de PDF sugiere el nombre neutro del ADR-0036 en ambas tabs, y los exports
  actúan sobre el documento activo resuelto por tab.

### Página "Ofertas" y contrato de postulación (ADR-0042)

- `/ofertas` es la vista de resultados del pipeline (variante D): sidebar de filtros
  (Estado: Todas / Capturadas / Postuladas + estados del contrato con counts; Perfil con
  toggle multi-perfil y "+ Agregar perfil" con puente de prompts a `build-profile`; Top
  matches con score ≥ 80), cards compactas (score, `rol - empresa`, estado/fecha/ATS,
  chips de metadata y 1 línea de motivo o confirmación) y visor con segmented de 4 vistas
  (Oferta original / CV adaptado / Cover letter / Postulación) y menú de tres puntos
  ("Cargar repaso", que navega a `/interview/?repaso=<slug>`, y "Descargar", que baja el
  archivo de la vista activa).
- `docs/job-offers/<slug>/application.md` es el contrato de resultado de una postulación
  (frontmatter validado con Zod): requeridos `empresa`, `rol`, `fecha` (alias legacy
  `fecha_envio`) y `estado` (`borrador | en preparacion | enviada | confirmada | vetada |
  descartada`, con `motivo` obligatorio en vetada/descartada); opcionales `ats`,
  `confirmacion`, `cv_enviado`, `cover_enviado`, `outcome` y `outcome_fecha`. El parser
  tolera alias y campos ausentes pero falla en build nombrando el archivo.
- El frontmatter de `offer.md` puede llevar `perfiles: frontend, ai`: ids de los
  posicionamientos del perfil a los que apunta la oferta, dato declarado, opcional y
  multi-perfil (una oferta puede apuntar a varios perfiles).
- Reglas de UI: pills solo para etiquetas (chips/badges), rectángulos para acciones
  (botón base + primario/secundario/ghost), segmented para las vistas del visor, navbar
  como links con subrayado, `focus-visible`, transiciones 150ms, `prefers-reduced-motion`
  y escala tipográfica 11/12/13.
- El tracker del pipeline sigue siendo el dueño del estado del flujo de postulaciones; el
  score mostrado es el `match_score` del match-report y el Submit de cualquier postulación
  lo aprieta siempre el usuario (la UI no tiene acciones de envío ni seguimiento).

### Plan de repaso por oferta (ADR-0035)

- `docs/job-offers/<slug>/interview-review-plan.json`: prioridades ordenadas (tema, por
  qué importa e ids completos del banco) más los huecos que el banco no cubre. Validado
  en build con Zod y contra el banco: un id desconocido rompe el build nombrándolo.
- Lo genera la skill `build-interview-review-plan` en el pipeline del agente (sin puente
  de prompts); la app solo lo muestra, navega y consume.
- El estado del repaso vive en `interview-review` (`activeSlug` + marcas por tema) y nunca
  pisa `interview-progress`.

### Banco de entrevistas: expansión Fase C (ADR-0030)

- Las preguntas nuevas solo entran con fuente primaria verificada (1-3 por pregunta);
  un tema sin fuente citable queda como gap del plan de repaso y no se inventa.
- Los niveles se reparten a propósito (junior a architect): `level` refleja a quién se
  le pregunta en entrevistas, no la dificultad abstracta del tema.
- `content-designer` deriva tricky y quiz de preguntas ya validadas; cuando un área está
  en el cap de 12 MCQs, la rotación (sacar un MCQ duplicado o ya cubierto, entrar uno
  derivado de pregunta nueva) es el mecanismo para renovar el quiz.

## Comandos

```bash
pnpm install
pnpm run dev
pnpm run check
pnpm run build
pnpm run test
```

El gestor oficial es pnpm. No usar npm. Si `pnpm install` falla con
`ERR_PNPM_IGNORED_BUILDS`, revisar `pnpm-workspace.yaml` y los build scripts permitidos para
`esbuild` y `sharp`.

La suite E2E corre siempre contra el contenido demo: `pnpm run test` fuerza
`PROFILE_SOURCE=example` y `PLAN_SOURCE=example` y buildea a `dist-e2e` (ver
`playwright.config.ts` y `astro.config.mjs`), sin tocar el `dist/` de la instancia real. Así
la suite pasa igual en instancias con datos de usuario y ninguna spec depende de datos reales.

## Deploy

Sitio estático: cualquier host sirve. El camino probado es Cloudflare Pages y las notas
están en `docs/deploy.md`.

## Workflow de cambios

1. Editar el perfil (`src/content/profile.json`) o el contenido correspondiente.
2. Ejecutar `pnpm run check` y `pnpm run build`.
3. Si cambia una decisión duradera de contenido, privacidad o formato, actualizar este README
   y agregar o actualizar el ADR correspondiente.
4. Si es solo un ajuste de wording dentro de una decisión vigente, actualizar la sección
   afectada sin crear un ADR innecesario.
5. Contenido demo siempre ficticio. Nada de datos reales en el producto.

## Mapa de ADRs de producto

| ADR | Estado | Tema |
|---|---|---|
| 0007 | Vigente | Formato Astro, fuente JSON, ATS, idioma y exports |
| 0010 | Vigente | Sistema visual de temas y restricciones de impresión |
| 0011 | Vigente | Migración a pnpm y convención de AGENTS.md |
| 0016 | Vigente | Frontends estáticos en cualquier host; Cloudflare Pages probado |
| 0020 | Vigente | Upgrade de Astro antes del gestor de ofertas (terminó en Astro 7) |
| 0021 | Vigente | Isla React para el gestor de ofertas, excepción al stack sin framework |
| 0022 | Vigente | Carpeta por oferta con estados derivados del disco |
| 0023 | Vigente | Puente de prompts para escribir archivos y verificación por endpoint |
| 0024 | Vigente | Banco de interview prep, validación Zod, Shiki e isla React |
| 0025 | Vigente | Salario y recruiter en el contrato de captura de ofertas |
| 0026 | Vigente | Modelo de perfil en capas con posicionamientos y fallback al ejemplo |
| 0027 | Vigente | Protocolo de salida al repo público |
| 0028 | Vigente | Contrato del plan de estudios con demanda colgada de la skill |
| 0029 | Vigente | Página `/learning`, contrato del plan bilingüe y progreso compartido |
| 0030 | Vigente | Banco de entrevistas reorganizado por fases del plan |
| 0031 | Vigente | Banco de experiencias en reserva (backlog) en el perfil |
| 0032 | Vigente | Cover letter por la skill sin agente externo |
| 0033 | Vigente | Build genérico deployable vs personal |
| 0034 | Vigente | Base de shadcn/ui para las islas React |
| 0035 | Vigente | Plan de repaso por oferta |
| 0036 | Vigente | Nombres neutros para los documentos exportados |
| 0037 | Vigente | Contenido externo como dato no confiable |
| 0038 | Vigente | Chequeo de duplicados y postulaciones previas antes de capturar |
| 0039 | Vigente | Formato de experiencia ATS-safe |
| 0040 | Vigente | "Mis CVs": fusión de `/` y `/adapted` con tabs y navbar consistente |
| 0041 | Vigente | Gates de `/learning` con evidencia citada, sin estado inventado |
| 0042 | Vigente | Contrato de postulación (`application.md`) y UI de resultados |

Los ADRs personales (decisiones del CV y hosting de las apps personales) están en
el repo privado de planning y son legado suyo. Los ADRs históricos se conservan como
contexto y no contradecir las decisiones vigentes de este README.

## Producto genérico: protocolo de salida (ADR-0027)

1. El repo público del producto se crea como repo nuevo desde un commit huérfano con solo
   código genérico, schemas y contenido demo. La historia personal jamás se hace push ahí;
   `git filter-repo` queda descartado.
2. El repo de desarrollo se renombra con el sufijo `-planning`, queda privado para
   siempre y conserva los issues, los documentos personales y la historia como legado.
3. El contenido de perfil real, las ofertas reales, las cover letters, los ADRs personales y
   de hosting y el plan de estudios personal viven en el planning o en la instancia privada de
   cada usuario.
4. Cada usuario despliega desde su instancia: fork privado del repo público con sus datos. El
   criterio de clasificación genérico vs personal y la regla de contenido demo ficticio están
   en el ADR-0027.

## Changelog de producto

- 16 sep 2026: gestor de ofertas con carpeta por oferta (ADR-0020 a 0023), upgrade a Astro 7,
  skills del flujo en `skills/job-seeking/` e isla React en `/adapted`.
- 22 sep 2026: header unificado (Toolbar compartido) en `/` y `/adapted`, y flujo de cover
  letters en la adaptación.
- 17 sep 2026: `/interview` con el banco validado, filtros, quizzes y escenarios de código.
- 23 sep 2026: metadata de salario y recruiter en el contrato de ofertas (ADR-0025).
- 28 sep 2026: progreso de estudio en `/interview` con export/import versionado.
- 28 sep 2026: investigación de mercado AI junior/trainee y rutas de aprendizaje para el
  diseño de `/learning`.
- 28 sep 2026: definición del producto genérico (ADR-0026 a 0028): perfil en capas, criterio
  de genérico vs personal, contrato del plan y protocolo de salida.
- 30 sep 2026: spec de `/learning` (#34) y tickets de implementación (#35 a #42).
- 30 sep 2026: perfil en capas con fallback al ejemplo (#28) y onboarding con skill
  `build-profile` (#29).
- 5 oct 2026: reevaluación del plan de estudios con fuentes nuevas y confirmación de
  ADR-0028/0029/0030 sin cambios de forma.
- 5 oct 2026: implementación de `/learning` (#35 a #42): contrato del plan, página, gaps,
  progreso compartido, banco por fases y enlaces con `/interview`.
- 5 oct 2026: QA del banco de AI contra sus fuentes (#43), nav "Plan de estudios" en el
  Toolbar, contenido demo de ofertas y specs contra fixtures (#30) y split documental de lo
  genérico y lo personal (#32).
- 6 oct 2026: banco de experiencias en reserva (`backlog`) en el perfil, con contrato de
  defensabilidad por item y promoción a CV por confirmación (ADR-0031).
- 9 oct 2026: la cover letter la propone y guarda `adapt-resume-to-offer` sin pasar por un
  agente externo: se va el flujo de copiar y pegar de `/adapted` y queda un modal de solo
  lectura con export a PDF y DOCX, más DOCX en el menú "Export to" (ADR-0032).
- 9 oct 2026: build blindado: `pnpm run build` genera el build genérico deployable en
  `dist/` (perfil y plan demo, solo ofertas `demo: true`) y `pnpm run build:personal` el de
  datos reales en `dist-personal/`, con avisos no invasivos en el header (ADR-0033).
- 9 oct 2026: regla de interrupción en `capture-job-offer` y `adapt-resume-to-offer`: solo
  bloquean antes de arrancar las preguntas sin default razonable. El resto (salario,
  recruiter, modalidad, location, backlog, skill aprendible, fechas ambiguas, score en la
  frontera) se trabaja con default, se pregunta en un solo lote al final y se parchea el
  resultado sin rehacer el trabajo.
- 11 oct 2026: Fase A de `/interview`: el detalle pasa a scroll normal (sin sticky),
  contraste corregido ("Ver respuesta", números del header y el h1 sobre header oscuro),
  secciones "Preguntas trampa" y "Mis notas" contraídas por defecto con renombre al español,
  tooltips de ayuda en "Tu progreso" y "Preguntas trampa", árbol de áreas con "Todas las
  áreas" y checkbox por grupo (estado indeterminado y plegable) y split de "Filtro" (sobre
  las tarjetas) y "Búsqueda global" (⌘K, ranking área > título > respuesta, acciones por
  resultado). Base de shadcn/ui para las islas con Tailwind v4 acotado y tokens puenteados
  al tema (ADR-0034), suite E2E movida a los puertos 4531/4533 y facetado estricto (selección
  vacía = 0 resultados).
- 11 oct 2026: `refresh-for-interview` se muda al repo (`skills/job-seeking/`) desde el
  catálogo global de skills, con la ruta del contrato corregida al contrato de carpetas.
- 12 oct 2026: Fase B: cada skill documenta su "Contrato y límites" (qué contrato es
  dueña, qué escribe y qué no toca); la skill `build-interview-review-plan` (antes
  `refresh-for-interview`, ahora sin drill de entrevistador: solo arma y guarda el plan)
  genera el plan de repaso por oferta con su contrato `interview-review-plan.json`
  validado en build contra el banco (ADR-0035); botón "Cargar repaso" en `/adapted` y
  carga confirmada en `/interview` (AlertDialog + toast, marcas por tema y filtro
  opcional, sin tocar `interview-progress`). Las skills quedan redactadas con tildes y
  ñ correctas.
- 16 oct 2026: Fase C del banco de `/interview`: 22 preguntas nuevas con fuentes
  primarias verificadas (1-3 por pregunta) y derivados de `content-designer` (22 tricky
  groups, 7 MCQs nuevos con rotación en áreas al tope del cap, 5 escenarios de código).
  Cubren con profundidad los temas del addendum del ADR-0030 — análisis de errores y
  métricas de evals, trade-offs de RAG, costo y latencia, guardrails y seguridad del
  agente, fluidez con herramientas de AI — más los huecos de los planes de repaso
  (Angular, RxJS, NgRx, Storybook, Chart.js/D3) y memoria persistente de agentes,
  redacción de PII, caché semántica y LoRA a nivel concepto. El banco queda en 379
  preguntas con niveles repartidos de junior a architect.
- 18 oct 2026: C6a, dos preguntas nuevas de valor dual (plan principal y plan B): SQL
  intermedio (window functions, planes de query con EXPLAIN) en `python-backend-cloud` y
  capa semántica/dbt (MetricFlow, metric drift) en `rag-retrieval`, con tricky, un MCQ y
  un escenario de SQL derivados. Banco en 381 preguntas.
- 13 oct 2026: `adapt-resume-to-offer` ofrece, apenas el CV adaptado queda listo, guardar
  su PDF en la ubicación que elija el usuario (paso 11), y el alcance de las skills queda
  explícito: preparan y guardan en la app, nunca postulan; postular es un paso aparte y
  cada envío requiere confirmación explícita del usuario.
- 16 oct 2026: los documentos que el usuario sube o adjunta salen con nombre neutro
  (`<apellidos> <nombres> - CV - <LOCALE>.pdf`, sin empresa ni rol) y se guardan en una
  carpeta `CV - <empresa>` fuera del repo, para no delatar que el CV está adaptado
  (ADR-0036). El PDF del paso 11 y los exports de la app (print, DOCX del CV y de la
  cover letter) comparten la convención.
- 16 oct 2026: el contenido externo (ofertas, páginas, fetch, subagentes) queda
  definido como dato no confiable: datos y no instrucciones, sin side effects, sin
  seguir links internos, sin enviar datos del perfil, y reportando cualquier intento de
  inyección al usuario (ADR-0037). La regla operativa vive en `capture-job-offer` y la
  referencian el resto de las skills y el `AGENTS.md`.
- 19 oct 2026: chequeo de duplicados y postulaciones previas antes de capturar
  (ADR-0038): `capture-job-offer` compara el input por link (`url` y `url_alternativa`
  de las ofertas capturadas), por contenido (el mismo aviso publicado otra vez) y por
  `application.md` ("ya postulada", con fecha y estado), y el frontmatter de `offer.md`
  suma `url_alternativa` para registrar publicaciones repetidas sin crear carpeta nueva.
- 19 oct 2026: formato de experiencia ATS-safe (ADR-0039): el empleo se renderiza en dos
  líneas (rol y luego `Empresa | fechas del empleo`), los proyectos internos van con la
  etiqueta `Project:` y años compactos (`2023-2026`), y los nombres de proyecto siguen la
  convención `Marca cliente - descriptor` en el perfil y los CV adaptados. Aplica en el CV
  principal, el CV adaptado y el export DOCX; `build-profile` y `adapt-resume-to-offer`
  escriben la convención.
- 21 oct 2026: revisión v3 del formato ATS-safe (ADR-0039) tras probar el PDF contra el
  parser de Compassion: el empleo va en tres líneas (rol, empresa, fechas), los proyectos
  se renderizan como bullets con la etiqueta `Project:` y sin fechas propias, y la línea de
  contacto queda en texto plano sin links. Los años compactos de proyecto del formato v2
  quedan descartados por defecto (disparaban empleos falsos en el parser).
- 21 oct 2026: revisión v4 del formato ATS-safe (ADR-0039): las asignaciones por cliente
  vuelven con años en paréntesis como bloques `Client: <cliente> (<años>) | descriptor`
  dentro del empleo (patrón umbrella con placements, sin flag de job-hop), y los bullets
  usan caracteres literales (`•`, `-`) en vez de markers de lista para que se copien con
  el texto y los parsers los lean como delimitadores.
- 21 oct 2026: investigación de parsing ATS consolidada en `docs/research/ats-parsing.md`
  (hallazgos, fuentes citadas y métodos de verificación: test de copia, capa de texto del
  PDF y parse real), con la regla de ciclo evidencia -> ADR-0039 -> cambio de formato, y
  referenciada desde `build-profile` y `adapt-resume-to-offer`. La referencia anti-huella
  de estilo de `adapt-resume-to-offer` apunta a la investigación real
  (investigación interna de escritura ATS, fuera de este repo) en vez del
  `docs/research/README.md` inexistente.
- 21 oct 2026: Fase D — "Mis CVs" fusiona `/` y `/adapted` en dos tabs ("CVs base" con
  cards por posicionamiento que reemplazan al toggle del toolbar, y "CVs adaptados" con
  el gestor de ofertas), la ruta `/adapted` se elimina sin stub (deep link canónico
  `/?tab=adaptados`) y la navbar de 3 destinos ("Mis CVs", "Prep entrevistas" y "Plan de
  estudios") queda consistente en todas las páginas desde el componente `SiteNav`, con el
  Toolbar completo solo en "Mis CVs". El print sigue emitiendo solo el documento activo y
  el diálogo de PDF sugiere el nombre neutro en ambas tabs (ADR-0040).
- 21 oct 2026: cierre del formato ATS revisión v4 (ADR-0039) con specs que afirman el
  contrato de render en las tres superficies (CV base, CV adaptado y DOCX): línea
  `Client:`/`Cliente:` con años compactos entre paréntesis, bullets de texto literal
  (`•`, `-`), sin rangos de fecha sueltos por proyecto y contacto en texto plano. El
  DOCX pasa a marcadores literales (el numbering nativo de Word no llega a la capa de
  texto que leen los extractores) y rotula el label por idioma según la proyección
  activa; el contenido demo se alinea a la convención `Marca cliente - descriptor`
  para que el ejemplo demuestre el contrato.
- 23 oct 2026: Fase E — los gates de `/learning` se presentan citando evidencia, nunca
  inventando estado (ADR-0041): `gateEvidence` opcional por fase con citas
  `commit` / `url` / `file` (ref verificable, label, `asOf` y `source`), estado derivado
  de las citas ("cumplido con evidencia citada" sin marcado manual; sin citas, marcado a
  mano como siempre) y resumen desglosado. Contrato aditivo: `gate` sigue siendo el
  texto del criterio y `version: 1` no cambia. Aviso de resync al agente de evidencias por el
  cambio de contrato del plan.
- 26 oct 2026: Fase F arranca con su **diseño aprobado** (UI de resultados del pipeline de
  postulaciones: sección "Ofertas" con filtros por estado, "Mis CVs" pasa a "Mis Perfiles"
  con "+ Agregar perfil", y visor de material con las vistas Oferta original / CV adaptado /
  Cover letter / Postulación) y su **primer cambio implementado**: el contrato de resultado
  `application.md` con schema Zod nuevo (`src/schemas/application.ts`), lectura validada en
  el read model de ofertas (`parseApplicationFile`, con alias legacy `fecha_envio`) y ofertas
  demo con postulación ficticia (aurora-labs confirmada, nimbus vetada). El tracker del
  pipeline sigue siendo el dueño del estado de las postulaciones.
- 26 oct 2026 (tarde): la **UI de la variante D queda como producto** (ADR-0042): página
  `/ofertas` con sidebar de filtros (Estado con counts del contrato, Perfil multi-perfil con
  "+ Agregar perfil" vía puente de prompts a `build-profile`, Top matches), cards compactas y
  visor con segmented de 4 vistas y menú de tres puntos (Cargar repaso / Descargar); navbar
  de 4 destinos ("Mis perfiles" · "Ofertas" · "Prep entrevistas" · "Plan de estudios") como
  links con subrayado; chip de estado y sección "Postulación" en el gestor de ofertas con
  deep link `?tab=adaptados&oferta=<slug>`. Nuevo campo declarado `perfiles` en el frontmatter
  de `offer.md` (multi-perfil, opcional) documentado en `capture-job-offer`, que es la dueña
  del contrato de carpetas junto con el registro `application.md`. El prototipo descartable se
  capturó como fuente primaria en la rama `prototipo/ui-resultados-fase-f`.
- 27 oct 2026: la Fase F queda **commiteada en la instancia** en cinco commits atómicos
  (uno por cambio: contrato `application.md`, vista `/ofertas` + navbar + `perfiles`, chip y
  sección "Postulación" con deep link, ADR-0042 y docs, y planning). Sin cambios de
  producto: esta entrada registra el cierre de la deuda de commits de la Fase F; el WIP de
  otras sesiones sigue sin commitear (para sus sesiones o una tarea dedicada).
- 27 oct 2026 (tarde): **el plan real se captura** con `capture-learning-plan` (modo directo):
  `src/content/learning-plan.json` existe y `/learning` deja de caer al ejemplo. Es el plan
  personal del ADR-0028 con su encuadre devuelto (título con objetivo, diagnóstico explícito
  en los summaries de roles, horizonte sin fecha en la fase 0) y **sin `gateEvidence`**: las
  citas demo del ejemplo no viajan (la evidencia nunca se inventa) y los gates quedan con
  marcado manual hasta que el agente de evidencias mande su payload (ADR-0041). La skill del plan
  `agent-patterns` pasa a `ai-agents` para que el join con el perfil salga exacto. El plan
  real se commitea a la instancia privada como `profile.json` y nunca viaja al repo público
  (el script de sincronización interno lo excluye). Sin cambios de superficie de producto: sin re-sync al
  staging; el próximo sync lleva las entradas del 27-oct con su auditoría (cumplido en el
  re-sync del 27-oct tarde, más abajo en este changelog). Aviso de resync
  enviado al agente de evidencias por la cláusula transversal y **cerrado por ese agente el
  mismo día sin cambio de estado en gates** (corrigió su tabla de citas, que medía contra el campo
  `project` en vez del criterio `gate`).
- 27 oct 2026 (tarde): se quitan los **back-links de las islas** (pendiente de la Fase D,
  decisión de la persona usuaria): `/interview` perdía "← CV principal" y `/learning`
  "Volver al CV" — la navbar de 4 destinos + brand ya cubre la navegación a "Mis perfiles".
  Se limpian las reglas CSS asociadas (`.interview-back` / `.header-rule` /
  `.learning-back`) y se alinean los comentarios stale "Mis CVs" → "Mis perfiles".
  Commit `33150a9` (selectivo en `InterviewPrep.tsx`, que tiene WIP ajeno). Por tocar
  `/learning`, aviso de resync al agente de evidencias (sin cambios de datos ni de contrato
  del plan). Verificación en verde: 302 tests.
- 27 oct 2026 (tarde): **re-sync al staging** con el cambio de back-links (primera
  superficie de producto que viaja desde el cierre de la Fase F): 221 archivos genéricos,
  auditoría grep de identidad (los 6 tokens del gate) antes y después en
  verde (0 fugas) y suite del staging en verde (**258 tests**). Commit del staging
  `59fc75c`. El sync cumplió lo acordado: se llevó las entradas 27-oct del changelog y
  arrastró el WIP genérico de otras sesiones sin commitear (`.gitignore`, `AGENTS.md`),
  como en los syncs anteriores; lo personal y las ofertas reales quedaron fuera.
- 27 oct 2026 (tarde): **salida al repo público** (ADR-0027): el repo público queda publicado
  al estado actual del producto, con su `README` raíz ("Enchula mi Resume") y la licencia MIT.
  Pre-publicación: fuera la identidad de los archivos genéricos (un dominio personal en
  `astro.config.mjs` y en el ADR-0033), limpieza de referencias internas en docs, skills y
  código (el agente de evidencias, sin rutas de infraestructura privada) y `.gitignore` del
  repo público restaurado con las protecciones de datos del usuario (`profile.json`,
  `learning-plan.json` y solo las ofertas demo), divergente por diseño del de la instancia
  privada. Verificación en verde: 258 tests. **Esta entrada viaja al repo público en el
  próximo sync.**
- 28 oct 2026: se cierra la **cola de la salida al repo público**. (1) Metadata del repo en
  GitHub: description genérica ("Enchula mi Resume — CV e interview prep en un sitio Astro
  estático, bilingüe ES/EN y ATS friendly…"), 10 topics y homepage apuntando a la demo.
  (2) **Deploy de la demo en Cloudflare Pages**: proyecto `enchula-mi-resume` conectado al
  repo público por integración git (auto-deploy en push a `main`), build `pnpm run build`,
  output `dist/`, `NODE_VERSION=24`. La demo queda en `https://enchulame-el-resume.pages.dev`
  respondiendo 200 en sus cuatro rutas con el banner "Datos de ejemplo, no son datos reales"
  y auditoría de identidad sobre el HTML publicado en 0. Sin cambios de archivos de producto
  (solo metadata y hosting): sin suite, sin re-sync al staging y sin resync con el agente de
  evidencias.
- 28 oct 2026 (tarde): **fix del gate de identidad**: `capture-job-offer/SKILL.md` publicaba
  una ruta absoluta de la máquina como ejemplo de dónde vive una skill externa; el texto queda
  como referencia genérica ("si no la encontrás entre tus skills instaladas, preguntarle al
  usuario dónde vive"). La auditoría de la salida del 27-oct no la había agarrado porque
  grepeaba rutas con `\` y esta iba con `/`: **los barridos de identidad pasan a grepear las
  dos variantes de slash** (barra invertida y barra normal, incluidas las rutas del perfil de
  usuario). Corregido en
  los dos árboles y publicado con commit nuevo encima, sin reescribir historia.
