# ADR-0046: Contenido bilingüe markdown, curiosidades y taxonomía de 34 áreas

Estado: Vigente. Completa el contrato del banco de `/interview` decidido en la Fase I
(`docs/planning/fase-i-interview.md`, contrato congelado el 10 nov 2026). Los ADRs
previos del banco (0024, 0030, 0035) siguen vigentes salvo lo que este ADR cambia.

## Contexto

El banco de `/interview` (381 preguntas, 24 áreas) tenía un contrato de contenido que la
Fase I decidió reemplazar de una sola vez, para que la reescritura posterior (F3) escriba
directo en la forma final:

- Las respuestas eran prosa compacta sin ejemplos ni tablas, con el código en un campo
  aparte (`codeBlocks`) que el mini-renderer de la isla mostraba al final. El renderer
  (`MarkdownText`/`InlineText`) solo entendía párrafos, bullets, código inline y negritas.
- El concepto de "tricky / pregunta trampa" (schema con campo `trap`, 24 archivos
  `*.tricky-quiz.json`, UI "Preguntas trampa" / "Solo tricky" / flag "T", skills y docs)
  estaba impregnado en todo el producto y la persona usuaria decidió retirarlo: su
  sustituto son las **curiosidades** (repreguntas típicas del entrevistador dentro de la
  respuesta).
- El contenido era monolingüe (inglés) y se decidió bilingüe EN/ES.
- La taxonomía de 24 áreas mezclaba temas que se confunden en entrevista
  (JavaScript con TypeScript, HTML/CSS con accesibilidad, React con SSR, seguridad con
  auth, etc.) y se aprobaron 9 splits por `topic` que la llevan a 34 áreas.

Restricción dura: **los ids de pregunta no cambian**. Los referencian los
`interview-review-plan.json` de ofertas reales y el progreso en `localStorage`
(ADR-0030 ya permite prefijo histórico en los ids).

## Decisión

1. **Markdown real bilingüe.** `question` y `answer` pasan a `{ en, es }` con markdown
   real (párrafos, `###`, tablas, listas, links, negritas). `en` siempre está; `es` puede
   quedar vacío y la UI cae al otro idioma **campo por campo** (pregunta, respuesta,
   captions de los fences y curiosidades). La búsqueda indexa ambos idiomas.
2. **El código vive en el markdown.** El campo `codeBlocks` desaparece: sus bloques se
   migraron como fences al final del markdown de `answer` (misma posición visual de hoy).
   Convención de caption en el info string del fence:
   ```` ```js caption="Output: A, D, B, C" ```` — el caption es opcional y se muestra bajo
   el bloque. Los fences se pre-renderizan con Shiki en el build (`marked` para la prosa)
   con un shell de código accesible: header con label de lenguaje + «N líneas», gutter
   numerado como **hermano** del HTML de Shiki (los tokens de Shiki cruzan líneas: el HTML
   no se parte por línea), `role="group"` + aria-label y `tabindex=0` en el pre para scroll
   con teclado. El mismo shell se usa para cualquier bloque de código (incluido el de los
   escenarios de quiz).
3. **Curiosidades reemplaza a los follow-ups previos.** Nuevo campo por pregunta
   `curiosidades: [{ question: {en, es}, answer: {en, es} }]`, repregunta típica del
   entrevistador con su respuesta corta, renderizado como sección "Curiosidades" al final
   de la respuesta (estilo contenido, no colapsable). El campo `trap` no existe en ningún
   lado: los 529 items migrados conservan su pregunta y su respuesta y descartan el texto
   de trampa. La UI renombra "Solo tricky" a "Con curiosidades" (mismo filtro, sobre
   `curiosidades.length > 0`) y la flag "T" a "C".
4. **El quiz por área vive en `<area>.quiz.json`** (antes `*.tricky-quiz.json`): el archivo
   es solo `quiz: { mcqs, scenarios }` y el área sale del nombre del archivo. Las formas de
   mcq y scenario no cambian. Los pisos de conteo por archivo bajan a 1 (los caps de
   12 MCQs / 4 escenarios se mantienen): el reparto de los quizzes de las madres entre sus
   áreas hijas va por afinidad temática del texto de cada item y produce quizzes menores
   que el cap histórico.
5. **Taxonomía de 34 áreas por `topic`** (9 splits aprobados): `javascript` +
   `typescript`; `html` + `css` + `accesibilidad`; `react` + `frameworks-ssr` (con las
   preguntas de `angular`); `seguridad` + `auth`; `backend` + `bases-de-datos`;
   `mobile-web` + `react-native`; `http-y-tiempo-real` + `diseno-de-apis`; `git` +
   `ci-cd-y-cloud`; `estado-en-la-ui` + `data-fetching`. Las otras 15 áreas (las 5 de fase
   del plan de estudios y las 10 coherentes sin split) no se tocan. Los grupos del árbol de
   áreas llevan cada hija al grupo de su madre, con los dos grupos que quedaban de 6
   repartidos por criterio. **Los ids de pregunta conservan su prefijo histórico**
   (permitido por ADR-0030): el progreso del usuario y los planes de repaso siguen
   válidos sin migración.
6. **Bilingüe en la UI con fallback.** Toggle EN/ES en el header de la isla, persistido en
   `interview-lang` (default EN, el idioma de las entrevistas). Los textos de UI siguen en
   español. El estado de la vista (`interview-ui-state`) renombra su flag a
   `onlyCuriosidades`; un estado guardado con el shape anterior se descarta y la isla cae a
   los defaults (validación conservadora ya existente).

## Alternativas descartadas

- **Migrar el código a fences dentro del markdown manteniendo `codeBlocks` en paralelo**:
  dos fuentes de verdad para lo mismo.
- **Traducir todo el contenido de una**: la traducción completa es trabajo de la F3 (con su
  revisión); esta fase solo cambia formato y deja `es` vacío salvo una pregunta muestra.
- **Borrar los ids con prefijo histórico**: rompe el progreso guardado y los planes de
  repaso de ofertas reales (ya probado con ADR-0030).
- **Partir el HTML de Shiki por línea para numerar dentro del bloque**: los tokens de
  Shiki cruzan líneas (un string puede empezar en una línea y terminar en otra); el gutter
  va como hermano y las dos columnas comparten métricas de línea.

## Consecuencias

- La reescritura de contenido (F3) escribe directo en este contrato: respuestas con
  markdown real, código embebido donde el criterio didáctico diga, curiosidades por
  pregunta y traducciones `es`.
- `content-designer` deriva curiosidades y quizzes al nuevo contrato;
  `research-content` escribe preguntas bilingües con fences con caption.
- Los conteos de quiz por archivo ya no son uniformes (el reparto por afinidad dejó
  `git` con 2 MCQs y `react` con 10, por ejemplo); el cap de 12 sigue siendo el tope.
- Cualquier referencia vieja a "tricky", "pregunta trampa" o `trap` en ADRs antiguos es
  historia y no se reescribe (historia viva).
