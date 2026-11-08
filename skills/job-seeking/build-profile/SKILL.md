---
name: build-profile
description: Entrevistar a la persona usuaria y escribir su perfil maestro en src/content/profile.json bajo el schema del repo. Usar cuando el usuario pide "armar mi perfil", "crear mi CV maestro", "onboarding", "entrevistarme para el perfil". Produce identidad, hechos, skills como entidad y los dos posicionamientos (frontend y AI), con cada campo de texto en es y en. NO captura ofertas ni adapta CVs: para eso están capture-job-offer y adapt-resume-to-offer.
---

# Build Profile

Entrevistar a la persona usuaria y producir su perfil maestro: identidad, hechos
(experiencia, educación, certificaciones, idiomas y proyectos personales), skills
como entidad y los dos posicionamientos (frontend y AI), con cada campo de texto
en es y en. El resultado siempre converge a lo mismo: `src/content/profile.json`,
un documento que pasa la validación Zod del build (`src/schemas/profile.ts`).

## Contrato y límites

- **Dueña de**: el contrato del perfil maestro (`src/content/profile.json`,
  schema `src/schemas/profile.ts`, ADR-0026). El detalle de las capas está en
  la sección "Contrato" más abajo.
- **Escribe**: solo `src/content/profile.json`.
- **No toca**: ofertas (`docs/job-offers/`), el banco de entrevistas, el plan de
  estudios ni los CVs adaptados.

## Modo de operación

Un solo modo: el usuario pide armar y guardar su perfil, y aplicás todos los
pasos, incluido el guardado en disco. (El "modo app" — devolver un JSON para
pegar en la app del CV — se retiró con el puente de prompts, ADR-0023 obsoleto
desde el ADR-0045: la app se opera con un agente corriendo las skills.)

## Contrato

El perfil es la fuente única de datos del CV y de /learning.
Antes de entrevistar, leer `src/schemas/profile.ts` (el contrato exacto) y
`src/content/profile.example.json` (una forma completa de referencia, con persona
ficticia). No inventar campos fuera del schema.

Cuatro capas y un banco de reserva:

- **Identidad**: `identity.name` y `identity.contact` (phone, email, location,
  linkedin, github).
- **Hechos** (`facts`): `experience`, `education`, `certifications`, `languages`
  y `projects`. Una sola vez, compartidos por todos los posicionamientos.
- **Skills como entidad** (`skills`): id estable, name, category, level
  defendible y evidence opcional.
- **Posicionamientos** (`positionings`): v1 con dos, id `frontend` y id `ai`.
  Cada uno con title, summary, `skillIds` (selección y orden de skills) y
  `bulletIds` (selección y orden de bullets).
- **Banco de experiencias en reserva** (`backlog`, ADR-0031): fragmentos listos
  para CV que todavía no entran a ninguna proyección, cada uno con `id`, `kind`
  (`experience` | `skill` | `project`), `origin`, `text`, `proof` (por qué es
  defendible), `limits` (techo: qué NO reclamar), `skillIds` y `status`
  (`reserve` | `promoted`). Es opcional y con default `[]`, así que se puede
  omitir. Sirve para capturar lo que la persona hace y sabe pero que no va al CV
  base, con el techo escrito para no sobrevalorarlo después.

Localización: cada campo de texto es `{ "es": "...", "en": "..." }` con ambos
obligatorios. Los identificadores (id, url, email, teléfono) no se localizan. Las
fechas visibles del CV sí: `startDate`, `endDate` y `date` son texto localizado
con mes y año legibles ("Abr 2021" / "Apr 2021"), no formato ISO.

Interfaz con /learning: cada bullet de experiencia y cada proyecto personal puede
llevar `skillIds` opcionales. Es lo que alimenta las sugerencias "esto ya lo
tocaste en X". Los bullets necesitan id estable porque el posicionamiento los
selecciona y ordena, y porque /learning los referencia.

## Pasos

### 1. Preparar el material

- Leer `src/schemas/profile.ts` y `src/content/profile.example.json`.
- Si existe `src/content/resume.json`, leerlo. Es contenido personal heredado:
  sirve de material de la entrevista para no re-preguntar lo que ya está escrito
  (nombre, contacto, fechas, bullets, skills, summaries), pero el perfil es lo
  que se escribe. No copiar su shape ni tratarlo como fuente.
- Leer los guardrails de `AGENTS.md`: claims defendibles, sin nombres internos ni
  métricas exactas del código privado.

Criterio de completado: el schema, la forma de referencia y el material heredado
están en tu contexto.

### 2. Entrevistar

Trabajar por tandas con preguntas interactivas (el formato de pregunta del
entorno del agente). Cubrir SIEMPRE los cuatro bloques, los dos posicionamientos
y los dos locales:

1. **Identidad**: nombre completo, teléfono, email, ubicación (es y en), LinkedIn
   y GitHub.
2. **Hechos**:
   - Experiencia: por empleo (empresa, rol, fechas, ubicación opcional) y, dentro
     de cada empleo, por proyecto de trabajo (nombre, url opcional, fechas) con
     sus bullets. Cada bullet es un logro concreto y defendible, con texto en es
     y en y `skillIds` opcionales. El nombre del proyecto sigue el formato
     `Marca cliente - descriptor del proyecto` (ej: "Aeronix - cargo operations
     console"): la marca primero para el escaneo rápido de recruiters y
     el descriptor después para mostrar alcance técnico (ADR-0039). Las fechas del
     proyecto se guardan en el JSON y se muestran como años compactos entre
     paréntesis en la línea de cliente (`Client: <cliente> (2023-2026) |
     descriptor`), que se renderiza como bullet de texto literal dentro de la
     descripción del empleo: el único rango de fechas largo es el del empleo, para
     que un parser ATS no lea los proyectos como empleos separados. Los bullets
     llevan carácter literal (`•` y `-`), no marker de lista, para que se copien
     con el texto (ADR-0039, revisión v4). Fondo, fuentes y métodos de
     verificación: `docs/research/ats-parsing.md`. Si aparece evidencia nueva de
     un parse de ATS, registrarla en ADR-0039 antes de cambiar el formato.
   - Educación: institución, título, fechas y note opcional (por ejemplo, una
     carrera incompleta declarada de forma honesta).
   - Certificaciones: nombre y note opcional. El uso diario de herramientas no es
     una certificación.
   - Idiomas: nombre, nivel y evidence opcional que respalde el nivel.
   - Proyectos personales: nombre, url, fecha opcional, descripción y `skillIds`
     opcionales. Solo entran los desplegados con URL viva (guardrail de
     `AGENTS.md`).
3. **Skills como entidad**: id estable, name, category, level defendible y
   evidence opcional. Solo lo que la persona pueda explicar en entrevista, sin
   skill salad: no agregar una tecnología solo porque aparezca en ofertas.
4. **Posicionamientos** (siempre los dos, `frontend` y `ai`): title y summary en
   es y en, `skillIds` en orden de importancia y `bulletIds` en orden de impacto.
   El summary se redacta en párrafos separados por doble salto (típicamente 4:
   quién sos y qué hiciste, lo más destacado, idiomas y forma de trabajo, qué
   buscas). Un empleo sin bullets seleccionados desaparece de esa proyección, y
   eso está bien: cada posicionamiento elige sus bullets.

Sobre los dos locales: entrevistar en el idioma de la persona usuaria y escribir
los dos campos con traducción fiel. Si redacta en un solo idioma, proponer la
traducción y pedir revisión.

Preguntar solo lo que cambia el resultado: fechas ambiguas, si un claim es
defendible (el criterio es de la persona usuaria), cómo redactar un bullet, qué
`skillIds` relacionar. No re-preguntar lo que el material heredado ya responde.

Criterio de completado: los cuatro bloques cubiertos, con los dos posicionamientos
y los dos locales resueltos.

### 3. Armar el documento

- **Ids de skill y de bullet**: kebab-case en minúsculas, cortos, derivados del
  contenido (`freightline-modernizacion`, `react-query`). Estables entre sesiones:
  el posicionamiento y /learning los referencian. Sin duplicados.
- **Referencias resueltas**: todo `skillIds` apunta a una skill declarada y todo
  `bulletIds` apunta a un bullet declarado. Nada huérfano.
- **Campos opcionales**: si no aplican, se omiten. Nunca mandar null ni strings
  vacíos.
- **Ambos locales**: cada campo de texto con sus dos variantes, sin excepciones.

Criterio de completado: el documento pasa `profileSchema` (se confirma en el
paso 4).

### 4. Guardar en disco

Contrato de guardado:

- **Destino**: `src/content/profile.json`. Es el mismo archivo que el build carga
  primero (`src/lib/profile.ts`); está en el gitignore (el perfil real no se
  commitea) y el ejemplo ficticio `src/content/profile.example.json` queda como
  fallback del build.
- **Si ya existe un perfil**: leerlo primero y tratar la entrevista como
  actualización. No pisar en silencio datos que la persona no mencionó.
- **Validación**: correr `pnpm run build`. La validación Zod del build falla
  ruidosamente con ids huérfanos, ids duplicados o campos sin los dos locales, y
  el error lista los issues. Corregir y reintentar hasta que pase.

Criterio de completado: `src/content/profile.json` existe en disco y el build
pasa.

## Comunicación con el usuario

Trabajar de forma transparente y hacer preguntas cuando la duda es real:

- **Antes de empezar**, declarar en una línea el plan: qué tandas va a cubrir,
  qué material heredado va a usar y qué archivo va a escribir.
- **Mientras trabaja**, decir en qué tanda está y qué queda pendiente.
- **Preguntas interactivas** para las dudas que cambian el resultado (fechas,
  defendibilidad de un claim, redacción de un bullet, relación de `skillIds`). No
  preguntar trivia que el agente puede decidir solo.
- **Transparencia de límites**: si un dato no se puede verificar o la persona no
  lo recuerda, decirlo y dejar el campo opcional afuera. Nunca inventar.

## Reglas

- Claims defendibles según los guardrails de `AGENTS.md`: lo que escriba la
  entrevista tiene que sostenerse en una entrevista técnica.
- Sin nombres internos ni métricas exactas del código privado. Redondear las
  métricas públicas ("más de X", "decenas de").
- El level de la skill no se imprime en el CV; la evidence sí, entre paréntesis.
- Proyectos personales solo con despliegue y URL viva.
- Fechas visibles como texto localizado, no como ISO.
- Ids estables: no renombrar ni reutilizar ids ya escritos.
- Sin em-dashes, en-dashes ni flechas en archivos ni JSON.
- El contenido demo (`profile.example.json`) es ficticio y se conserva tal cual:
  nunca reemplazarlo con datos reales.
