# Enchula mi Resume

Producto de CV e interview prep: un sitio Astro estático, bilingüe, ATS friendly, con
pipeline de ofertas, banco de preguntas y plan de estudios navegable. Cualquier usuario clona el repo,
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
- El sitio es Astro 7 (upgrade documentado en ADR-0020). "Mis perfiles" (`/`) muestra el
  CV base canónico imprimible (estático vanilla) con su sidebar de perfil, idioma y tema;
  `/ofertas` es la vista de resultados del pipeline, con layout fluido de paneles
  redimensionables (Fase H2) y el visor de documentos (Oferta original · Match report ·
  CV adaptado · Cover letter · Postulación), y `/interview` y `/learning` son islas React
  (ADR-0024, ADR-0029 y ADR-0042). La navbar de 5 destinos
  ("Mis perfiles", "Ofertas", "Fuentes", "Prep entrevistas" y "Plan de estudios") es la
  misma en todas las páginas y se estila como links con subrayado (ADR-0040 y ADR-0042).
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
- La app no tiene flujos de creación: el pipeline se opera con un agente de IA corriendo
  las skills del repo, que escriben los archivos y validan en build; la app lista y revisa
  exactamente lo que hay en disco (ADR-0045, que retiró el puente de prompts del ADR-0023).
- Las skills del flujo viven en `skills/job-seeking/`: `build-profile`, `capture-job-offer`,
  `adapt-resume-to-offer`, `research-content`, `content-designer`, `capture-learning-plan`,
  `build-interview-review-plan` y `register-sweep`.
- El pipeline de búsqueda tiene su contrato (ADR-0043): fuentes de cualquier tipo con su
  playbook de extracción (`docs/job-search/sources/`), barridos registrados con ids
  estables por vacante, estados y descartes con motivo (`docs/job-search/sweeps/`) y la
  página `/fuentes` con el catálogo en tarjetas colapsadas por defecto (header con chips
  y stats visibles; playbook y ofertas al expandir), la sección "Barridos" con el
  historial del pipeline y las ofertas por fuente con sus stats. Las
  ofertas capturadas se vinculan a su fuente y barrido por `fuente`/`barrido`/`id_vacante`
  en el frontmatter de `offer.md`. Los datos reales del pipeline son del usuario y nunca
  viajan al repo público.
- Cada oferta puede llevar un plan de repaso (`interview-review-plan.json`, ADR-0035) que
  `build-interview-review-plan` genera cruzando los "Temas a repasar" del match-report
  contra el banco. El visor de `/ofertas` ofrece "Cargar repaso" por oferta (navega a
  `/interview`) y `/interview` lo carga con confirmación (AlertDialog) y toast, con marcas
  por tema y filtro opcional al repaso, sin tocar `interview-progress`.

## Fuente de verdad

El perfil (`src/content/profile.json`, schema Zod en `src/schemas/profile.ts`) es la fuente
única de datos del CV. El build carga el profile local si existe y cae al ejemplo ficticio
`src/content/profile.example.json` si no. La validación ocurre en build y falla ruidosamente
con datos mal formados (ids de skill o de bullet huérfanos, campos sin los dos locales, ids
duplicados).

La página `/` renderiza la proyección activa del perfil (posicionamiento más locale),
calculada en `src/lib/profile-projection.ts`. El brand sale del perfil. `/learning` consume
el read model del perfil (`src/lib/profile-read-model.ts`).

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
2. Ejecutar la skill `build-profile` (`skills/job-seeking/build-profile/SKILL.md`). La
   entrevista cubre identidad, hechos (experiencia, educación, certificaciones,
   idiomas y proyectos), skills como entidad y los posicionamientos, con cada campo de texto
   en es y en. El perfil se guarda en `src/content/profile.json` (dato del usuario: nunca
   viaja al repo público) y se valida con
   `pnpm run build`.
3. Opcional: `capture-learning-plan` escribe `src/content/learning-plan.json` con el plan de
   estudios propio.
4. Verificar con `pnpm run check && pnpm run build && pnpm run test`.

## Decisiones vigentes

### Formato y arquitectura

- Astro 7 genera HTML, CSS y JavaScript estáticos.
- El CV principal mantiene interactividad vanilla. Las páginas `/ofertas`, `/interview` y
  `/learning` usan islas React porque administran estados y flujos de interacción más
  complejos.
- El layout principal es single column para mantener la lectura ATS.
- El toolbar (chrome del sitio) usa un ritmo horizontal propio, constante en las 5 rutas
  (`--chrome-max` / `--chrome-pad` en `Layout.astro`), desacoplado del `--content-max` /
  `--content-pad` de cada página: el brand y la nav quedan siempre en la misma posición al
  navegar entre rutas y los anchos de contenido de cada página no se tocan. La alineación
  barra-contenido (H3d) se conserva solo en "Mis perfiles", donde el ritmo del chrome
  coincide con la columna del CV.
- La experiencia laboral se renderiza en formato ATS-safe, revisión v4 (ADR-0039): una
  entrada por empleo en tres líneas (rol, empresa, fechas del empleo); las asignaciones por
  cliente se renderizan como bloques `Client: <cliente> (<años>) | descriptor` dentro de la
  descripción, con bullets de carácter literal (`•`, `-`) y nombres en la convención
  `Marca cliente - descriptor`; y la línea de contacto va en texto plano sin links.
- El toggle de idioma y el panel de tema funcionan del lado cliente y viven en el sidebar
  de "Mis perfiles" (Fase H).
- El CV se imprime desde el navegador con `window.print()` y CSS de impresión, sin una
  librería de PDF. El export de la app es el diálogo reutilizable "Descargar" (Fase H3):
  oferta PDF/TXT · match report MD · CV PDF/DOCX/JSON · cover PDF/MD · postulación MD/TXT,
  compartido entre "Mis perfiles" y `/ofertas`. Los PDF salen por impresión del navegador
  con el nombre sugerido neutro (ADR-0036), el DOCX por `buildResumeDocx` (ADR-0039) y los
  textos verbatim (MD con frontmatter, TXT sin).
- La impresión conserva el accent elegido para headings y URLs, con texto y fondo claros para
  mantener legibilidad y parsing.
- `/interview` mantiene UI en español y contenido del banco en inglés. El progreso de estudio
  se persiste en `localStorage` con claves propias (`interview-progress`) y se exporta/importa
  como JSON versionado validado con Zod. La vista de la página (filtros, orden, pregunta
  seleccionada y filtro del repaso) también se persiste (`interview-ui-state`) y se restaura
  al montar la isla, validada contra el contenido vigente: áreas e ids de pregunta que ya no
  existen se descartan con criterio conservador.
- `/interview` usa shadcn/ui en su isla (ADR-0034): filtrado facetado estricto (selección
  vacía = 0 resultados), árbol de áreas con "Todas las áreas", checkbox por grupo con estado
  indeterminado y plegado, y búsqueda global (⌘K) con ranking área > título de pregunta >
  respuesta y acciones por resultado (ir a la pregunta y practicar). La respuesta se muestra
  siempre en el detalle, sin toggle "Ver respuesta". Las secciones "Preguntas trampa" y
  "Mis notas" van contraídas por defecto ("Mis notas" abre si hay una nota guardada).

### Producto genérico (decisión de #26)

- El perfil del usuario es la fuente única de datos, en capas: identidad, hechos, skills como
  entidad y posicionamientos. `/` renderiza la proyección del perfil (posicionamiento más
  locale) (ADR-0026).
- El perfil lleva además un `backlog` de experiencias en reserva: fragmentos listos para CV con
  su prueba y su techo (`proof` y `limits`), que no se renderizan mientras están en `reserve`.
  Se promueven a un CV adaptado por decisión de la persona usuaria, o al CV base
  materializándolos en hechos (ADR-0031).
- El build carga el profile local si existe y cae al `profile.example.json` si no. El contenido
  demo es siempre ficticio (persona y empresas inventadas).
- El plan de estudios es un contrato JSON propio con la demanda colgada de la skill y no del
  curso (ADR-0028).
- El onboarding de un usuario nuevo es la skill de agente `build-profile`, que escribe el
  perfil directo y valida en build (ADR-0045). El camino de clonar a CV maestro está
  documentado arriba.
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

### Página "Mis perfiles" (Fase H; antes ADR-0040)

- "Mis perfiles" (antes "Mis CVs") vive en `/` con el CV base canónico imprimible y su
  sidebar (Fase H1): selector de perfil en lista (los posicionamientos del perfil son los
  perfiles: Frontend, Frontend AI, y los que se agreguen), idioma y tema. Sin JavaScript
  se renderiza el CV base y el print emite solo el documento activo (el sidebar no se
  imprime). El “Descargar” del sidebar abre el diálogo reutilizable (Fase H3) con el set
  del CV activo: PDF · DOCX · JSON del posicionamiento e idioma activos.
- Navbar consistente de 5 destinos ("Mis perfiles" · "Ofertas" · "Fuentes" · "Prep
  entrevistas" · "Plan de estudios") en todas las páginas, desde el componente compartido
  `SiteNav`, como links con subrayado. El Toolbar completo (brand + nav + aviso de build)
  vive solo en "Mis perfiles"; el resto de las páginas conservan la barra slim.
- Los documentos que viajan a un portal o un email (CV y cover) salen con nombre neutro
  (ADR-0036, `<apellidos> <nombres> - <documento> - <LOCALE>.<ext>`, con el nombre sugerido
  vía `document.title` en el PDF); el registro propio (oferta, match report, postulación)
  sale con el nombre literal del archivo.

### Página "Ofertas" y contrato de postulación (ADR-0042 y ADR-0044)

- `/ofertas` es la vista de resultados del pipeline (variante D): sidebar de filtros
  (Estado: **Todas / Capturadas / Borrador / Enviadas / Confirmadas / Descartadas**, con
  counts facetados — el número de cada filtro es exactamente lo que devuelve la lista al
  activarlo; Perfil con toggle multi-perfil; Top matches con score ≥ 80), cards compactas
  (score, `rol -
  empresa`, estado/fecha/ATS, chips de metadata y 1 línea de motivo o confirmación) y
  visor con segmented de 5 vistas (Oferta original / Match report / CV adaptado / Cover
  letter / Postulación) y menú de tres puntos (“Cargar repaso”, que navega a
  `/interview/?repaso=<slug>`, y “Descargar”, que abre el diálogo reutilizable con el set
  completo de la oferta: la vista activa queda marcada, las entradas sin archivo quedan
  deshabilitadas y los PDF imprimen solo el documento elegido). El
  CV adaptado se renderiza con el mismo markup ATS v4 que el CV base, con la tipografía
  acotada al panel del visor (Fase H1), y el deep link canónico de una oferta es
  `/ofertas/?oferta=<slug>` (selección con la URL al día).
- El layout de `/ofertas` es fluido, con dos splitters (sidebar ↔ feed y feed ↔ visor)
  que redimensionan los paneles con drag o flechas del teclado (con clamps) y recuerdan
  su ancho en localStorage; el visor arranca al ancho de la hoja del CV de "Mis perfiles"
  y en viewport chico el layout queda apilado, sin splitters (Fase H2). La sección
  "Barridos" del pipeline vive en `/fuentes`.
- `docs/job-offers/<slug>/application.md` es el contrato de resultado de una postulación
  (frontmatter validado con Zod): requeridos `empresa`, `rol`, `fecha` (alias legacy
  `fecha_envio`) y `estado` (`borrador | enviada | confirmada | descartada`, con
  `motivo` obligatorio solo en `descartada`; los legacy `en preparacion` y `vetada` los
  funden `borrador` y `descartada`, ADR-0044); opcionales `ats`, `confirmacion`,
  `cv_enviado`, `cover_enviado`, `outcome` y `outcome_fecha`. El parser tolera alias y
  campos ausentes pero falla en build nombrando el archivo.
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
| 0021 | Retirado en la Fase H (ver ADR-0045) | Isla React para el gestor de ofertas, excepción al stack sin framework |
| 0022 | Vigente | Carpeta por oferta con estados derivados del disco |
| 0023 | Obsoleto (ADR-0045) | Puente de prompts para escribir archivos y verificación por endpoint |
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
| 0040 | Retirado en la Fase H (ver ADR-0045) | "Mis CVs": fusión de `/` y `/adapted` con tabs y navbar consistente |
| 0041 | Vigente | Gates de `/learning` con evidencia citada, sin estado inventado |
| 0042 | Vigente | Contrato de postulación (`application.md`) y UI de resultados |
| 0043 | Vigente | Fuentes y barridos del pipeline de búsqueda |
| 0044 | Vigente | Estados de la postulación a cuatro (`borrador · enviada · confirmada · descartada`) |
| 0045 | Vigente | Retiro del puente de prompts: la app se opera con un agente corriendo las skills |

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
  output `dist/`, `NODE_VERSION=24`. La demo queda en `https://enchula-mi-resume.pages.dev`
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
- 28 oct 2026 (sesión operativa): mantenimiento del pipeline de búsqueda de empleo —
  barrido periódico de fuentes con la capa de vetos del flujo unificado, registro de
  outcomes en el tracker, una postulación nueva corriendo el flujo unificado de punta a
  punta (captura, análisis, CV adaptado validado, cover aprobada por la persona usuaria,
  documentos con QA y envío con Submit de la persona usuaria), y cierre del ajuste de la
  skill de una fuente de ofertas al dominio nuevo del tablero (verificado en vivo, suite de
  la skill en verde). Sin cambios de producto: sin suite del producto, sin re-sync al
  staging y sin resync con el agente de evidencias.
- 29 oct 2026: **rename del proyecto: "Enchulame el Resume" → "Enchula mi Resume"**
  (`enchulame-el-resume` → `enchula-mi-resume`). Ejecución por capas: (1) referencias
  textuales en ~50 archivos de 8 árboles (instancia, staging, legacy, job-search-tools,
  workspace root, memento, ai-job-search, career-ops); (2) rename de los 3 repos de GitHub
  (`-planning` incluido) con redirect automático y remotes locales actualizados;
  (3) rename de las 4 carpetas del workspace + paths hardcodeados en `sync-staging.mjs`,
  `final-register.py` y `validate-adapted.ts`; (4) rename de los 2 proyectos Cloudflare
  Pages (display name; las URLs `*.pages.dev` NO cambian según el diálogo de Cloudflare).
  ADRs y registros históricos sin tocar (sin reescribir historia). La raíz del workspace
  queda pendiente (sesión propia). Verificación: `check && build && test` en verde (302
  tests) tras cada capa. 6 commits atómicos en la instancia, 1 en staging, 1 en legacy,
  1 en memento y 1 en ai-job-search.
- 30 oct 2026 (sesión operativa): **rename de la raíz del workspace intentado y pospuesto**.
  El rename de la carpeta del workspace (`enchulame-el-resume` → `enchula-mi-resume`) no se
  puede hacer en
  caliente: los procesos del propio tooling de la sesión (`opencode.exe` y los MCP servers y
  wrappers hijos) nacieron con esa carpeta como directorio de trabajo y Windows rechaza el
  rename ("recurso ocupado"; verificado con Sysinternals Handle: 13 handles en 11 procesos).
  `session_move` no libera esos handles. Decisión de la persona usuaria: reiniciar la compu y
  renombrar la carpeta a mano antes de abrir T3 Code; la sesión que continúe cierra la capa
  (paths de `sync-staging.mjs`, `final-register.py` y `validate-adapted.ts`, `session_move` a
  la raíz nueva, suite en verde y cierre del pendiente — todo escrito en "Pendientes con
  gatillo" del roadmap). Pendiente nuevo: actualizar el inventario de hosting (nombres de
  repo, URLs `*.pages.dev` y paths locales viejos del rename del 29-oct). Sin
  cambios de producto: sin suite, sin re-sync al staging y sin resync con el agente de
  evidencias.
- 30 oct 2026 (sesión de cierre del rename): **última capa del rename cerrada: la raíz del
  workspace**. La persona usuaria renombró la carpeta a mano tras el reinicio
  (`enchulame-el-resume` → `enchula-mi-resume`); esta sesión corrió ya
  sobre la raíz nueva (sin `session_move`), actualizó los 3 paths hardcodeados restantes
  (`sync-staging.mjs` ROOT, `final-register.py` BASE + el path de la plantilla de
  `application.md`, `validate-adapted.ts` import; gate grep de `enchulame-el-resume` = 0 en
  los 3 scripts) y cerró con `check && build && test` en verde (302 tests). **Corrección de
  realidad**: el rename de los proyectos Cloudflare Pages del 29-oct **sí** cambió las URLs
  `*.pages.dev` (el diálogo de CF decía lo contrario): las URLs viejas
  `enchulame-el-resume*.pages.dev` dejan de resolver y las nuevas
  `enchula-mi-resume*.pages.dev` responden 200 (verificado 30 oct) — la entrada del 29-oct
  queda como registro de lo anotado entonces. El inventario de hosting quedó actualizado
  (nombres de repo, URLs verificadas y paths locales). Pendientes del rename de la raíz y de
  actualización del INVENTARIO cerrados en el roadmap. Sin cambios de producto: sin re-sync al
  staging y sin resync con el agente de evidencias.
- 31 oct 2026: **la deuda de commits queda en cero**. Todo el WIP sin commitear de las
  sesiones de octubre (contenido de interview, base shadcn/tailwind, modal de cover letter,
  plan de repaso, ADRs 0032-0038, perfil, ofertas reales 2026-10-08→10-19, reformatting de
  `adapted-resume.json`, skills del flujo, preparación del repo público, herramientas de
  planning, los hunks mixtos de 6 archivos y el helper `file-name.ts` sin trackear) se
  commiteó en la instancia en **14 commits atómicos por área** tras revisión hunk por hunk
  (los archivos mixtos por etapas, sin tocar el working tree; los riders de hunks
  inseparables van con disclosure en el mensaje). Working tree byte-idéntico al inicio
  (hashes verificados) y verificación en verde: 302 tests. Sin cambios de superficie de
  producto: sin re-sync al staging (esta entrada viaja en el próximo sync) y sin resync con
  el agente de evidencias.
- 1 nov 2026: **consolidación de los datos reales del legacy** (Cambio 4 de la Fase F):
  las carpetas de ofertas que vivían solo en el árbol legacy pasan a la instancia privada,
  con merge de los registros de postulación más nuevos, backfill de los registros faltantes
  (vetos y descartes con su motivo) y normalización al contrato ADR-0042 de los estados
  fuera del enum. Solo vive en la instancia: los datos reales nunca viajan al staging ni al
  repo público. Verificación en verde: 319 tests (el spec parametrizado de ofertas reales
  crece con las carpetas). Sin cambios de superficie de producto: sin re-sync al staging y
  sin resync con el agente de evidencias.
- 1 nov 2026: **Fase G arranca con su diseño aprobado y su contrato** (ADR-0043): fuentes
  de búsqueda de cualquier tipo con su playbook de extracción (cómo buscar, herramientas,
  quirks) y barridos registrados con ids estables por vacante, estados, descartes con
  motivo y particularidades que mejoran el playbook. Schemas Zod, read model, contenido
  demo y specs (11 tests). Aditivo: `offer.md` acepta `fuente`/`barrido`/`id_vacante`
  opcionales. Verificación en verde: 330 tests. El sync al staging se hace al cierre de la
  fase con su auditoría de rigor.
- 1 nov 2026 (Fase G, cierre): **fuentes y barridos como producto**. La página `/fuentes`
  lista el catálogo de fuentes con su tipo y su playbook de extracción (cómo buscar,
  herramientas, quirks), sus ofertas históricas vinculadas y sus stats; la navbar pasa a 5
  destinos; `/ofertas` suma la sección "Barridos" (historial con números, detalle de
  vacantes con motivo y particularidades del proceso) y el filtro por fuente. La skill
  `register-sweep` registra cada barrido y mejora el playbook de la fuente;
  `capture-job-offer` vincula cada captura a su fuente/barrido/id de vacante. Backfill de
  los dos barridos históricos del pipeline con todos sus descartes y motivos (los datos
  reales viven solo en la instancia; al repo público viaja solo el contenido demo).
  Verificación en verde: 337 tests en la instancia y 276 en el staging.
- 1 nov 2026 (sesión operativa): **barrido del pipeline registrado con el nuevo contrato**
  (primer uso de `register-sweep`): WAD, startupsargentina, a16z, Sequoia, career-ops,
  casilla y el sheet curado de fuentes nuevas, con vetos primero, 1 oferta capturada
  (frontera del umbral, decisión de postular en el usuario) y todos los descartes con su
  motivo en `docs/job-search/sweeps/`. La casilla dejó un rechazo viejo sin cargar en su
  registro de postulación: outcome completado al contrato. Sin cambios de superficie de
  producto: sin re-sync al staging (los barridos y ofertas reales son dato del usuario) y
  sin resync con el agente de evidencias.
- 2 nov 2026: **12 fuentes nuevas en el catálogo**, tomadas de las abiertas que el usuario
  mantiene para buscar empleo (leídas en solo lectura desde su navegador): una plaza
  freelance, una red de talento, una agencia de staffing, cinco career pages de empresas,
  una agregadora de roles remotos, los boards Workday de varias empresas y las alertas de
  una red social (tipo `social`, con la regla de cotejar siempre el ATS original). Cada
  una con su playbook (cómo buscar, herramientas y quirks). Los archivos de fuentes
  reales no viajan al staging (filtro demo del sync). Verificación en verde: 338 tests.
- 2 nov 2026 (tarde): **reglas de proceso del barrido + 8 fuentes nuevas y fuentes
  prioritarias**. El contrato de barridos queda con las reglas del usuario: cada barrido
  cubre todas las fuentes activas (las prioritarias primero), cada vacante cruza contra el
  radar (desde cuándo está en él, además de si ya está capturada o postulada), nada
  bloquea la pasada (una fuente inaccesible se registra con su causa y se sigue), y al
  final siempre una tabla en el chat con el resultado por fuente — las ayudas que haga
  falta se piden después de la tabla, nunca durante el barrido. Campos nuevos (aditivos)
  en el contrato: `prioridad` en fuentes y `enRadarDesde` en vacantes, con sus specs y
  chip en la página de fuentes. Ocho fuentes nuevas (boards de empresas pedidas por el
  usuario y un career site de Workday identificado por su JSON-LD) y seis fuentes marcadas
  como prioritarias (empresas cuya cultura gusta al usuario y donde tiene referentes
  posibles). Verificación en verde: 340 tests.
- 4 nov 2026: **reorden del workspace de desarrollo** (decisión de la persona usuaria):
  las carpetas del proyecto se renombran y ordenan (árbol de instancia, espejo público y
  material privado, este último con su contenido agrupado por tema), el árbol legado se
  elimina tras rescatar su único archivo único y verificar la paridad del resto, y la raíz
  queda documentada con un README de inventario y un AGENTS.md de reglas. Los paths
  internos de las herramientas se actualizan a los nombres nuevos. Sin cambios de
  superficie de producto más allá de un documento de diseño rescatado: esta entrada viaja
  al repo público en el próximo sync.
- 5 nov 2026: **Fase H arranca: los conteos de `/ofertas` describen la lista y los
  estados de la postulación quedan en cuatro** (H0a + H0b). El bug de conteos del 4-nov
  ("Todas 64" con 12 cards a la vista, filtros con cuenta positiva y lista vacía) tenía la
  causa en que los conteos del sidebar se calculaban sobre todas las filas mientras la
  lista aplicaba los filtros de perfil, fuente y Top matches: hoy los conteos son
  **facetados**, con los mismos predicados que la lista, y el número de cada filtro es
  exactamente lo que devuelve al activarlo (ADR de proceso: la repro y el diagnóstico
  quedan en `docs/planning/roadmap-fases.md`). La postulación pasa a cuatro estados
  (`borrador | enviada | confirmada | descartada`, ADR-0044): `borrador` funde el legacy
  `en preparacion` y `descartada` funde el legacy `vetada` (con `motivo` obligatorio solo
  en `descartada`), con backfill de los `application.md` reales y filtros de `/ofertas`
  sin el paraguas "Postuladas" (Todas · Capturadas · Borrador · Enviadas · Confirmadas ·
  Descartadas). Verificación en verde: 343 tests.
- 5 nov 2026 (Fase H, H0c): **quick wins de la vista "Ofertas"**. La vista
  Postulación enlaza la oferta publicada (`url` y `url_alternativa`, esta última
  repetible por contrato y con su nota), el feed queda con orden default de fecha
  descendente (sin colar las postuladas primero), el tip del header se retira
  (explicaba el flujo de export que la Fase H retira) y los grupos del sidebar de
  filtros quedan colapsables (Estado y Perfil abiertos, Fuente y Score
  colapsados; un grupo con filtro activo se fuerza abierto). Se corrige también
  el mojibake del verbatim en portugués: era UTF-8 leído como CP1252 guardado
  tal cual por la captura (un archivo, 80 secuencias), no el renderizador ni las
  reglas de limpieza; ahora hay test que falla nombrando el archivo y una regla
  de codificación en `capture-job-offer`. Verificación en verde: 353 tests.
- 6-8 nov 2026 (Fase H, H1): **"Mis Perfiles" con sidebar, visor de `/ofertas` con match
  report y retiro total del puente de prompts**. El match report pasa a ser la quinta
  vista del visor de `/ofertas` (Oferta original · Match report · CV adaptado · Cover
  letter · Postulación), con deep link propio `/ofertas/?oferta=<slug>` (H1a-H1b), y la
  tab "CVs adaptados" se elimina con todo su código: el gestor de ofertas entero
  (~1200 líneas), los puentes de prompts copiar/pegar y "+ Agregar perfil" (H1c-H1d).
  Se van también "Export to" / "Imprimir PDF" y el diálogo de LinkedIn entero (sus tres
  tabs): entre la H1 y la H3 la app no exporta nada (hueco de una tanda confirmado por
  la persona usuaria) y el contrato ATS v4 del DOCX se protege con unit test contra el
  Packer (H1e). "Mis perfiles" queda con sidebar de selector de perfil en lista, idioma y
  tema (H1f), y el CV adaptado de `/ofertas` se renderiza con el mismo markup ATS v4 que
  el CV base —tipografía acotada al panel, sin perder atributos ATS—, decisión elegida
  visualmente que recupera los specs de formato del adaptado (H1g). Cierre de
  documentación: las skills quedan solo en modo directo (fuera el "modo app"), el
  ADR-0023 queda obsoleto (ADR-0045), y el export JSON y el nombre neutro del PDF
  (ADR-0036) quedan sin superficie hasta el diálogo "Descargar" de la H3. Verificación
  en verde: 292 tests.
- 8 nov 2026 (Fase H, H2): **`/ofertas` fluido con paneles redimensionables y Barridos en
  `/fuentes`**. El layout de `/ofertas` deja el tope de ancho y queda fluido, con el visor
  por defecto al ancho de la hoja del CV de "Mis perfiles", dos splitters (sidebar y visor)
  con drag y flechas del teclado, clamps y anchos persistidos en localStorage; en viewport
  chico sigue apilado, sin splitters (H2c-H2d). La sección "Barridos" se muda a `/fuentes`
  (H2a) y las tarjetas de fuente quedan colapsadas por defecto: header con chips y stats
  visibles, playbook y ofertas al expandir (H2b). Verificación en verde: 298 tests.
- 8 nov 2026 (Fase H, H3): **el diálogo reutilizable “Descargar” cierra el hueco de export
  y la barra se alinea al contenido**. El diálogo (compartido entre “Mis perfiles” y
  `/ofertas`) exporta oferta PDF/TXT · match report MD · CV PDF/DOCX/JSON · cover PDF/MD ·
  postulación MD/TXT: los PDF por impresión del navegador con nombre sugerido neutro
  (ADR-0036), el DOCX por `buildResumeDocx` y los textos verbatim (MD con frontmatter, TXT
  sin). En `/ofertas` lo abre el menú de tres puntos con el set completo, la vista activa
  marcada y las entradas sin archivo deshabilitadas; los PDF imprimen solo el documento
  elegido sin mover la vista (H3a-H3c). Quick win del navbar (H3d): barra y contenido
  alineados por columna (`--content-max` / `--content-pad` compartidos entre la barra y los
  contenedores de las 5 páginas). Ojo con el registro: la observación del quick win (“el
  navbar tiene un tope de 1180px y queda más angosto que el contenido”) no se reproduce —
  el navbar siempre fue fluido y el 1180px era el contenido de Mis perfiles —; lo alineado
  fue la columna de contenido de cada página. Cierra el hueco de export confirmado el
  8-nov y el ADR-0036 vuelve a tener superficie. Verificación en verde: 326 tests.
- 10 nov 2026: fixes de UI de `/interview` y del header. La vista de `/interview` (filtros,
  orden, pregunta seleccionada y filtro del repaso) se persiste en `interview-ui-state` y se
  restaura al montar la isla, validada contra el contenido vigente: áreas e ids de pregunta
  que ya no existen se descartan (intersección con las áreas actuales; si la selección quedó
  vacía por drift vuelve a "todas") y "Limpiar" persiste el estado limpio. El toolbar se
  desacopla del ancho de contenido de cada página y queda con un ritmo horizontal propio del
  chrome (`--chrome-max` / `--chrome-pad`): brand y nav en la misma posición en las 5 rutas y
  la alineación barra-contenido (H3d) se conserva solo en "Mis perfiles". La respuesta del
  detalle se muestra siempre: fuera el toggle "Ver respuesta"/"Ocultar respuesta" y la
  búsqueda global navega a la pregunta (ir / practicar); "Mis notas" y "Preguntas trampa"
  mantienen sus collapsibles. Verificación en verde: 341 tests.
