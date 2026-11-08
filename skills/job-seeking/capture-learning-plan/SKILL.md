---
name: capture-learning-plan
description: Capturar el plan de estudios del usuario y escribirlo como contrato JSON validado en src/content/learning-plan.json. Usar cuando el usuario quiera cargar o actualizar su plan de estudios. NO investiga contenido del banco (eso es research-content) ni diseña quizzes (eso es content-designer).
---

# Capture Learning Plan

Capturar el plan de estudios del usuario (fases, recursos, skills con demanda,
roles que habilitan, anti-lista y señales de salida) y dejarlo como
`src/content/learning-plan.json`, el contrato del plan de ADR-0028, que pasa la
validación Zod del schema `src/schemas/learning-plan.ts` en build. El plan real
del usuario es gitignored; el ejemplo commiteado es
`src/content/learning-plan.example.json` y sale de una versión desidentificada.

## Contrato y límites

- **Dueña de**: el contrato del plan de estudios (ADR-0028):
  `src/content/learning-plan.json`, schema `src/schemas/learning-plan.ts`.
- **Escribe**: solo `src/content/learning-plan.json` (gitignored).
- **No toca**: el perfil, el banco de entrevistas ni las ofertas. El progreso
  del plan vive fuera del contrato (`learning-progress`, ADR-0029).

## Modo de operación

Un solo modo: el usuario pide capturar y guardar, aplicás todos los pasos y
escribís el archivo en disco, con la validación en build. (El "modo app" —
devolver un JSON para pegar en la app del CV — se retiró con el puente de
prompts, ADR-0023 obsoleto desde el ADR-0045.)

## Contrato (resumen operativo)

Campos del JSON (detalle exacto en `src/schemas/learning-plan.ts`):

- `version`, `id`, `title`: versión del contrato, id del plan y título.
  Todo texto localizado es `{ es, en }` con los dos obligatorios.
- `roles`: orden de ataque de roles (id, name, summary). El excluyente de cada
  rol se expresa dentro del summary.
- `antiList` y `exitSignals`: listas de texto localizado.
- `skills`: catálogo con id estable, name localizado y `demand` opcional
  (label localizado, source y asOf). La demanda cuelga de la skill, nunca del
  recurso (ADR-0028), y cada claim de demanda cita dataset y ventana temporal.
- `phases`: fases ordenadas (id, order, title, duration, topics, enablesRoles,
  skillIds, interviewArea, project opcional, gate, gateEvidence opcional,
  resourceIds). Sin huecos en order; cada fase con al menos un recurso y un gate.
- `gateEvidence` (opcional, ADR-0041): citas de evidencia del gate de la fase,
  una por hecho verificable (type `commit` | `url` | `file`, ref, label localizado,
  asOf `YYYY-MM-DD`, source de quien la produjo). El estado del gate nunca se
  guarda ni se inventa: con citas, `/learning` muestra "cumplido con evidencia
  citada" y el marcado manual no aplica; sin citas, el gate se marca a mano. Las
  citas se copian tal cual de la fuente que las produce (p. ej. el agente de
  evidencias externo): no fabricar commits, URLs ni fechas.
- `resources`: catálogo plano en muchos a muchos con skills (id, title como
  nombre propio sin traducir, url, creator, platform, price, duration,
  language del material, confidence opcional con fecha de captura, opinion,
  skillIds).

Reglas cruzadas que la validación exige: skillIds y resourceIds referenciados
existentes, order de fases sin huecos, cada fase con recurso y gate, y ambos
idiomas en cada texto localizado.

## Pasos

### 1. Identificar el input

- **Plan existente en texto** (un documento como `docs/planning/plan-estudios-ai.md`, un
  outline, notas). Convertirlo al contrato campo por campo.
- **Entrevista al usuario** (si no hay documento): preguntar objetivo y
  horizonte, fases con sus gates y proyectos, recursos por fase (link, creador,
  plataforma, precio, duración, idioma del material, opinión) y las skills que
  cada recurso enseña, con su demanda si se conoce.
- **Nada útil**: pedir el material al usuario. No fabricar fases ni recursos.

### 2. Armar el contrato

- Skills con id estable en kebab-case y sin mezclar con los id del perfil: la
  unión plan-perfil es por nombre normalizado y se resuelve en `/learning`, no
  en el contrato. (Si el usuario tiene su perfil cargado, se pueden alinear los
  ids a mano para que los joins salgan exactos; eso es un ajuste posterior.)
- Textos en es y en. Los títulos de recursos (nombres propios de cursos o
  libros) no se traducen; el resto de campos sí.
- Demanda: solo con fuente y fecha. Datasets válidos: Field Guide de Grigorev o
  serie de nothiring.me (ver `research-content`). Sin fuente, sin demanda.

### 3. Validar

- `pnpm run check && pnpm run build` con el plan guardado: el build valida el
  contrato con Zod y falla ruidosamente con referencias rotas, huecos de order
  o textos sin los dos idiomas.
- Correr también contra el ejemplo si se tocó: `learning-plan.example.json`
  debe seguir validando.

### 4. Guardar

- Escribir `src/content/learning-plan.json` (gitignored, nunca commitear).
- Confirmar al usuario que el build quedó verde y resumir fases, recursos y
  skills capturadas.

## Límites

- Un solo plan por usuario en v1 (AI). El contrato es genérico pero la app no
  tiene selector de planes.
- El progreso de estudio no vive en el contrato: es dato del usuario en
  `localStorage` (`learning-progress`), exportable e importable desde
  `/learning`.
- No commitear el plan real ni copiar datos personales al ejemplo. El ejemplo
  del producto es desidentificado por definición (ADR-0028).
