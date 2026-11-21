# ADR-0048: Topes de quiz por área ampliados

Estado: Vigente.

## Contexto

El contrato de quiz por área (ADR-0046) fijó topes heredados del material histórico:
`mcqs` hasta 12 y `scenarios` hasta 4 por `<area>.quiz.json`. La F3b general (20 nov
2026) agregó 128 preguntas nuevas al banco y los quizzes quedaron sin cubrir ese
contenido: cuatro áreas (agents-mcp, evals-production, llm-fundamentals y
rag-retrieval) estaban ya en el tope y no admitían ni un item nuevo, y varias áreas con
quiz fino (2–6 MCQs) tenían las preguntas nuevas sin material de práctica.

Dos opciones: reemplazar items existentes por derivados del contenido nuevo, o subir los
topes y sumar. Reemplazar tira material sano y hace girar la cobertura sin necesidad;
sumar preserva todo y deja que los items cubran el banco completo, que es el objetivo.

## Decisión

1. **Topes ampliados**: `mcqs` de 12 a **24** y `scenarios` de 4 a **8** por archivo de
   quiz (`interviewQuizFileSchema` en `src/schemas/interview-questions.ts`). Los pisos no
   cambian (mínimo 1 cada uno).
2. **Los items nuevos se derivan de las preguntas nuevas** por área (uno por pregunta
   como mínimo), se numeran continuando la convención del archivo (`<prefijo>-mcq-<n>`,
   `<prefijo>-sc-<n>`) y se integran sin reemplazar los existentes
   (`docs/planning/tools/merge-quizzes.mjs`).
3. El rango superior del test E2E del quiz de la demo se ajusta al nuevo tope; los
   pisos de conteo existentes no cambian.

## Consecuencias

- Los quizzes crecen con el banco: un área con muchas preguntas nuevas puede llegar a
  ~20 MCQs. Si el tamaño molesta en la UI, la salida natural es partir el quiz por
  tema, no bajar el tope.
- El tope sigue siendo un freno deliberado contra quizzes inmensos: no se sube más sin
  otra decisión.
- Los ids de items siguen estables por archivo; nada referencia ids de quiz desde fuera
  (las colecciones y los planes de repaso referencian ids de preguntas del banco).
