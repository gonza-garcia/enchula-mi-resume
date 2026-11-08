# ADR-0023: Puente de prompts para escribir archivos y verificación por endpoint

Estado: Obsoleto (8 nov 2026). Reemplazado por el ADR-0045: la app se opera con un
agente de IA corriendo las skills del repo y no queda ningún puente de prompts.

## Contexto

El sitio es estático: el JavaScript del navegador no puede escribir ni leer el
filesystem del repo, y no hay backend. Sin embargo, el flujo del gestor requiere
crear archivos (offer.md, análisis, adapted-resume.json) desde la app y confirmar
que quedaron en disco.

## Decisión

1. División de roles en cuatro pasos: el agente externo piensa donde hace falta
   (capturar del link con scraping, analizar match, adaptar CV) y devuelve un
   bloque JSON; la app valida ese JSON con Zod; la app compone los archivos de
   forma determinística combinando el JSON validado con las ediciones que el
   usuario hizo en el formulario; el agente externo escribe esos archivos verbatim
   en disco guiado por un prompt compuesto (contenido exacto + rutas). El guardado
   verbatim es a propósito: preserva las ediciones del usuario posteriores al
   output del agente y evita los errores típicos de escritura de un LLM
   (escaping, truncado, "mejoras" no pedidas).
2. Como fallback sin agente: los archivos compuestos quedan disponibles para
   descargar y el usuario los ubica a mano. Y para el paso Analizar existe la vía
   manual: la app muestra las secciones de match-report.md como template editable
   y el usuario las completa sin agente.
3. La verificación usa un endpoint GET de ofertas (`/api/job-offers.json`) que la
   app consulta con fetch al confirmar el usuario que el agente terminó. En dev el
   endpoint es fresco; en build queda prerenderizado. El flujo de creación es una
   herramienta local: en el sitio deployado los botones de creación quedan
   visibles pero deshabilitados, con tooltip que lo explica.
4. Modal de IA de dos columnas reutilizable (prompt compuesto / output JSON pegado),
   usado por capturar, analizar y adaptar. Modal unificado de guardado y verificación
   en dos pasos: muestra los archivos a crear (contenido colapsado, prompt copiable,
   descargas) y verifica con el endpoint mostrando el resultado inline con reintento.
5. El formulario también acepta texto plano con formato libre pegado del usuario
   (email, Slack, WhatsApp): la app lo parsea heurísticamente y autocompleta lo que
   puede, marcando los campos inferidos para revisión. El JSON fence sigue siendo
   el contrato principal con el agente.

## Opciones consideradas

- Recargar la página para verificar: descartado por perder el estado del flujo.
- Backend SSR o acciones de servidor para escribir: descartado, convierte el sitio
  en algo que ya no es estático por un flujo local.
- Solo descargas manuales: descartado como vía única, más fricción; queda como
  fallback.
- Agente con autonomía al escribir: descartado, pisaría las ediciones del usuario
  posteriores al output del agente y reintroduce errores de LLM en el disco.

## Consecuencias

- Sin agente disponible solo se alcanza Analizada por vía manual; Adaptar requiere
  agente (es reescritura de contenido).
- El output del agente siempre es un único bloque JSON validado con Zod antes de
  componer nada: si falla la validación, la app avisa y el flujo no rompe estado.
- El mismo prompt de guardado sirve para un futuro agente in-app: cambia quién lo
  ejecuta, no el contrato.
