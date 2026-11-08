# Enchula mi Resume

Contexto único del proyecto: el producto de CV, pipeline de ofertas y preparación de
entrevistas, y la instancia de uso personal que lo alimenta. Este archivo es glosario de
lenguaje compartido, no spec ni historial.

## Lenguaje

### Ofertas

**Oferta**:
Convocatoria de trabajo que se analiza contra el CV base y para la que puede
existir un CV adaptado.
_Avoid_: vacante, job posting, JD

**Slug de oferta**:
Identificador único y legible de una oferta con formato fecha-empresa-rol en
minúsculas con guiones. Nombra la carpeta de la oferta.
_Avoid_: id de oferta, nombre de carpeta, handle

**offer.md**:
Archivo canónico de una oferta: el texto verbatim de la convocatoria más su
metadata. Su existencia define el estado Agregada.
_Avoid_: archivo de análisis, job offer file

**match-report.md**:
Análisis de match de una oferta contra el CV base, con score y temas de
entrevista, como archivo independiente de la oferta. Su existencia define el
estado Analizada.
_Avoid_: análisis (suelto), reporte, informe

**adapted-resume.json**:
CV adaptado bilingüe para una oferta, con el mismo schema Zod que el CV base.
Vive dentro de la carpeta de su oferta.
_Avoid_: CV adaptado (como nombre de archivo), resume de oferta

**cover-letter.md**:
Carta de presentación aprobada por el usuario para una oferta, en la carpeta de
la oferta. La escribe `adapt-resume-to-offer` al aprobarse la carta; la app solo
la lee y la muestra. Archivo adicional: no cambia el
estado de la oferta.
_Avoid_: carta (suelta), presentación, motivation letter

**Estado de oferta**:
Etapa de la oferta en disco: Agregada, Analizada o Adaptada.
_Avoid_: status, fase, progreso

**Agregada**:
Estado inicial en disco: existe la carpeta con offer.md (sin análisis todavía).
_Avoid_: creada, guardada

**Analizada**:
Estado en que además existe match-report.md con el análisis de match y el score.
_Avoid_: procesada, evaluada

**Adaptada**:
Estado en que además existe adapted-resume.json para esa oferta.
_Avoid_: adaptada a la oferta (redundante), lista para aplicar

### Operación del pipeline

**Operación por skills**:
Flujo en el que la persona usuaria opera el pipeline con un agente de IA que
corre las skills del repo: la skill escribe los archivos y valida en build, y la
app solo lee, muestra y revisa lo que hay en disco (ADR-0045).
_Avoid_: puente de prompts, copiar y pegar, modo app

### Componentes y skills

**Isla de ofertas**:
Componente React hidratado en `/ofertas` que administra la lista de ofertas, sus
estados, el sidebar de filtros y el visor de documentos. No interviene en el CV base.
_Avoid_: gestor de ofertas, offers manager

**Isla de interview prep**:
Componente React hidratado en /interview que administra filtros, búsqueda, orden,
detalle de pregunta, quizzes y escenarios del banco. No interviene en el CV
principal ni en `/ofertas`.
_Avoid_: study app, app de preguntas

**build-profile**:
Skill que entrevista a la persona usuaria y escribe su perfil maestro validado
(`src/content/profile.json`), con guardado y validación en build.
_Avoid_: generador de CV, onboarding (para la skill), migrador de resume.json

**capture-job-offer**:
Skill que obtiene la oferta (del link o del texto pegado), extrae metadata y
texto verbatim, y la guarda siguiendo el contrato de carpeta.
_Avoid_: parser de ofertas, extractor

**adapt-resume-to-offer**:
Skill que analiza el match de una oferta ya capturada contra el CV base y genera
su adapted-resume.json.
_Avoid_: adaptador de CV, tailoring

### Interview prep

**Área**:
Una de las 20 categorías temáticas del banco de preguntas de entrevista. Es un filtro
principal y también identifica el archivo de contenido de origen.
_Avoid_: categoría suelta, subject

**Nivel**:
La profundidad esperada de una pregunta: Junior, Semi-senior, Senior, Staff / Lead o
Architect. Una pregunta tiene un único nivel.
_Avoid_: seniority (para la etiqueta visible)

**Rol**:
Perfil al que aplica una pregunta: Frontend, Backend o Fullstack. Una pregunta puede
tener varios roles.
_Avoid_: track

**Frecuencia**:
Señal híbrida de aparición esperada en entrevistas: Muy preguntada, Clave, menos
frecuente o Clave, muy poco frecuente.
_Avoid_: prioridad

**Tricky**:
Follow-up diseñado para descubrir una confusión común o un límite importante de la
respuesta principal. Explica la respuesta, el trap y por qué falla la intuición rápida.
_Avoid_: trick question, pregunta capciosa

**Banco**:
Conjunto curado de preguntas investigadas, con respuesta en inglés, metadata, fuentes
y, cuando corresponde, bloques de código.
_Avoid_: question dump, lista de preguntas

**Quiz**:
Práctica guiada por área con MCQs de cuatro opciones y escenarios de código con model
answer y rubric.
_Avoid_: examen

**Estado de aprendizaje**:
Marca de avance por pregunta: Sin marcar, Sé o Repasar. Se guarda en el navegador de
la persona usuaria, nunca en el repositorio.
_Avoid_: status, checklist

**Nota de estudio**:
Texto plano que la persona usuaria deja en una pregunta: resumen, trampas o links.
Sin formato rico ni HTML.
_Avoid_: comentario, apunte

**Progreso de estudio**:
Conjunto de estados y notas del banco, con export/import propio versionado y
validado. Vive en una clave de localStorage separada del tema del CV.
_Avoid_: datos guardados, backup

### Perfil, plan y producto genérico

**Perfil**:
Fuente única de datos de la persona usuaria: identidad, hechos, skills y
posicionamientos. Lo consumen el CV y `/learning`.
_Avoid_: CV maestro, resume.json, datos del CV

**Hechos**:
Experiencia, educación, certificaciones, idiomas y proyectos que comparten todos
los posicionamientos, con un solo contenido por campo.
_Avoid_: datos base, CV base, historial

**Posicionamiento**:
Una de las lecturas del perfil (título, summary, selección y orden de skills y de
bullets) orientada a un rol objetivo. v1 tiene dos: frontend y AI.
_Avoid_: track, variante de CV, versión

**Proyección**:
Lo que `/` renderiza: el perfil leído para un
posicionamiento y un locale concretos.
_Avoid_: CV base, resume.json, documento exportado

**Read model del perfil**:
Vista del perfil que consume `/learning`: skills con id, nivel y evidencia
opcional, posicionamiento activo y hechos con skillIds opcionales. Nunca el
shape del CV.
_Avoid_: datos del perfil para la página, contrato del CV

**Skill (entidad)**:
Capacidad con identidad propia (id estable), nivel defendible y evidencia
opcional, compartida entre el perfil y el plan de estudios.
_Avoid_: tecnología, item de skill

**Demanda**:
Señal de mercado de cuántas ofertas piden una skill. Se cuelga de la skill,
nunca del recurso que la enseña.
_Avoid_: popularidad, requerimiento del curso

**Contenido demo**:
Datos ficticios (persona y empresas inventadas) que el build usa cuando la
persona usuaria no cargó los suyos. Siempre ficticio, nunca datos reales
anonimizados.
_Avoid_: datos dummy, placeholder, ejemplo anonimizado

**Plan de estudios**:
Contrato de fases y recursos de `/learning`, con las skills que enseñan y su
demanda. El plan real de cada quien es dato de usuario; el del repo es el ejemplo.
_Avoid_: temario, syllabus, ruta (para el contrato)

**Gap**:
Diferencia entre las skills que el perfil declara y las skills que el plan pide.
_Avoid_: carencia, faltante, debilidad

**Gate**:
Condición de salida de una fase del plan de estudios. Se marca como cumplida en el
progreso del plan.
_Avoid_: checkpoint, criterio de salida

**Anti-lista**:
Qué no hacer del plan de estudios: rutas y opciones descartadas, con su motivo.
_Avoid_: lista negra, no hacer (suelto)

**Señal de salida**:
Condición del plan para empezar a aplicar a roles con lo estudiado.
_Avoid_: objetivo, meta

**Progreso del plan**:
Marcas de avance por recurso (hecho, en curso, skipped) y gates por fase, con
export/import propio versionado y validado. Vive en una clave de `localStorage`
separada del progreso de estudio del banco.
_Avoid_: datos guardados, checklist del plan

**Sugerencia desde hecho**:
Aviso de `/learning` que relaciona un hecho del perfil con una skill del plan no
declarada, para detectar capacidades practicadas sin declarar.
_Avoid_: hint, recomendación automática

**Material de investigación**:
Lista de lectura ordenada de `/learning`, contenido del repo, fuera del contrato del
plan y del perfil.
_Avoid_: bibliografía, lecturas del plan

**Planning**:
El repositorio privado donde viven los issues, los documentos personales y la
historia del proyecto.
_Avoid_: repo privado, docs privados

**Instancia**:
La copia privada del producto con los datos reales de la persona usuaria, desde
la que se despliega su sitio.
_Avoid_: fork de datos, mi repo, entorno personal
