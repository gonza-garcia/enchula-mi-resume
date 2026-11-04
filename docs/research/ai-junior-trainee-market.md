# Research: mercado de roles junior y trainee de AI (2026)

Fecha de investigacion: 28 de septiembre de 2026. Verificado en vivo contra la Guest Jobs API publica de LinkedIn (curl, 51 requests, sin login), los reportes de Apiva, Rung, RezScore, IT Jobs Watch y las paginas de ofertas citadas, mas websearch y Jina Reader para fuentes bloqueadas. Los backends con login de agent-reach (Reddit, Twitter) NO estan conectados en este entorno, asi que los threads de foro se citan desde los snippets de busqueda y Jina Reader, y cada uno marca que se pudo y que no verificar.

## Resumen ejecutivo

- El titulo **AI Engineer es el de mayor crecimiento en Estados Unidos en 2026**, con subas de 143% interanual en posteos segun el informe Jobs on the Rise de LinkedIn, y cuatro de los cinco roles de mayor crecimiento apuntan a AI de alguna forma (https://opendatascience.com/12-in-demand-ai-job-roles-2026-how-to-get-hired/).
- **La puerta de entrada es angosta.** Sobre 1.056 posteos vivos de AI Engineer en EE.UU. en septiembre de 2026, solo el **3,5% (37 posteos) estan abiertos a entry level**. En ML Engineer es peor: **1,9% (18 de 935)** (https://apiva.ai/reports/ai-engineer y https://apiva.ai/reports/machine-learning-engineer).
- El ratio se repite en un listado curado de 300 roles AI-native: **188 senior/staff+, 89 mid, 11 junior y new grad, 12 pasantias**. Es decir, aproximadamente 63% senior, 30% mid y 7% de entrada (https://github.com/landedjobs/ai-engineer-jobs).
- **Lo que mas se pide a quien entra no es ML clasico sino la capa de aplicacion sobre LLMs**: Python, LLM APIs, RAG, agentes y evaluacion. En el corpus de Apiva (707 descripciones de AI Engineer) las menciones son Python 68,4%, LLM 52,8%, RAG 34,7%, ML 32%, AWS 27,2%, prompt engineering 19,7%, PyTorch 18,6%, TypeScript 16,6%, LangChain 13%, vector databases 12,7% (https://apiva.ai/reports/ai-engineer).
- **Prompt Engineer como titulo standalone casi desaparecio**, pero la habilidad se absorbio en otros roles. Sobre 66.785 CVs analizados por RezScore solo **5 personas (0,01%) listan "Prompt Engineer" como titulo laboral**, y hay 7.359 posteos que mencionan prompt engineering contra 137.176 de Python (https://blog.rezscore.com/the-2026-job-market-what-the-data-actually-shows). Las busquedas del titulo en Indeed cayeron de 144 por millon en abril de 2023 a 20 o 30 por millon despues (https://qz.com/prompt-engineering-tokenmaxxing-ai-productivity-fads-history-061126).
- **El rol que mas crece y mejor encaja con perfiles de producto es Forward Deployed Engineer**: 381 posteos abiertos en 14 companias en septiembre de 2026, con Palantir (110), Databricks (106) y Salesforce (87) concentrando 303. Los posteos subieron **729% interanual** segun datos de Indeed recogidos por Business Insider. El 99% de las descripciones enfatiza trato con cliente, 79% APIs e integraciones y 78% Python (https://rungcode.io/reports/forward-deployed-engineer-jobs y https://www.aol.com/news/job-postings-tech-role-grown-185134480.html).
- **Para un perfil frontend con anos de producto existe un cruce real y contratado**: AI Product Engineer, AI-native Frontend y Full-stack con LLM. Ejemplos verificados hoy: Alma busca a alguien que "diseñe el agente y tambien construya la UI que lo expone" con React; SimilarWeb pide React/TypeScript mas "AI-Augmented Engineering" (usar Cursor, Copilot, Claude y evaluar criticamente el codigo generado); CRED pide React + GraphQL para dashboards, agent UIs y extensiones de Chrome (https://www.tealhq.com/job/product-engineer-ai_7ea1a30acc57318dbeb4d8a2470ebf1de9be9, https://builtin.com/job/senior-full-stack-engineer-frontend-oriented-ai-first-product-team/9659174, https://talents.studysmarter.co.uk/companies/cred/frontend-engineer-react-remote-11038425).
- El contexto de juniors es duro en general: la encuesta Open University 2026 Business Barometer (1.500 lideres de negocio del Reino Unido) hallo que el 51% dice que AI cambia como contratan y el **19% redujo la contratacion entry-level**, y de esos el 42% lo atribuye a la adopcion de AI (https://www.cnbc.com/2026/09/23/ai-workplace-graduate-entry-level-junior-hiring.html). A la vez, los puestos entry-level que mencionan skills de AI casi se duplicaron interanual (https://www.cnbc.com/amp/2026/04/29/entry-level-jobs-calling-for-ai-skills-nearly-doubled-from-a-year-ago-report.html).
- **En Argentina y LatAm hay oferta real pero concentrada en Buenos Aires y Brasil**, y con salarios muy por debajo del mercado estadounidense. Bandas entry de AI/ML en Argentina reportadas para 2026: entre USD 1.500 y 3.150 mensuales (https://nearshorebusinesssolutions.com/ai-ml-engineers). Sobre 30 tarjetas de la query "junior AI engineer" con location Argentina, 20 aparecen en Buenos Aires o Gran Buenos Aires.

## Panorama de roles entry-level

Fuentes de esta tabla: Guest Jobs API de LinkedIn verificada hoy (17 queries, 412 tarjetas unicas, https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search), reportes de Apiva de septiembre 2026, listado curado de Landed, reporte de Rung sobre FDE, y RezScore sobre prompt engineering.

| Rol | Demanda relativa | Seniority real | Pide titulo formal | Perfil de entrada |
|---|---|---|---|---|
| AI Engineer (junior / entry level / graduate) | Alta en volumen de busqueda, muy baja en vacantes realmente abiertas a juniors: 3,5% de 1.056 posteos en EE.UU. | Casi todo mid o senior. Solo 1,5% del titulo dice entry level o junior, 2% dice internship | Si en la mayoria: 10 de 14 descripciones entry-level muestreadas mencionan degree, bachelor, master o equivalente | Python obligatorio, LLM APIs, RAG, algo de agentes, testing. El titulo de grado aparece en la mitad de las ofertas entry |
| ML Engineer junior / new grad | Alta en busqueda, muy baja en apertura real: 1,9% de 935 posteos | Senior 32,8% y staff 22,4% del total; entry level 1,3% | Si, con fuerza: 79% de los posteos de ML engineering piden titulo tecnico | Python, PyTorch o TensorFlow, deep learning, ML clasico, MLOps, cloud. Es el perfil mas academico |
| LLM Engineer / Applied AI Engineer | Media y creciente. RAG aparece en 3.276 posteos indexados en 90 dias, con suba de 73% contra las 4 semanas previas | Mayormente mid-senior; los titulos "graduate" o "associate" existen pero son pocos | A veces; mas flexible que ML Engineer | LLM APIs, RAG, embeddings, prompt engineering, evaluacion, orquestacion. Menos entrenamiento de modelos y mas integracion |
| AI Product Engineer | Media, pero es el que mejor encaja con perfiles de producto y frontend | Mezcla: hay mid, hay senior, hay "associate" | Frecuente pero negociable cuando hay producto demostrable | Frontend solido (React, TypeScript, Next.js), mas RAG, agentes y evals. Ejemplo verificado: 1 a 2 anos construyendo productos LLM orientados a usuario (https://joblinking.com/ai-product-engineer/) |
| Prompt Engineer (standalone) | Baja como titulo. 7.359 posteos contra 137.176 de Python. Solo 5 de 66.785 CVs lo usan como titulo | Entry-level existe pero es minoritario; la mayoria de las busquedas son mid o senior | Poco exigido en las versiones junior; los roles senior si piden ingenieria | Historias de perfil no tecnico (redaccion, UX, docencia) que entraron en 2023 y 2024. En 2026 la habilidad se absorbio dentro de AI Engineer y Applied AI |
| AI Automation Engineer / AI Agent Developer | Media y en alza. La skill "agents" es la mas pedida del mercado AI segun aidevboard, con 3.068 posteos de 9.846 | Predominantemente mid; pocos titulos junior | Poco; se valora mas el flujo de trabajo demostrado | Construccion de agentes, tool calling, orquestacion, integraciones, algo de Python o JS. Ejemplo argentino verificado: Darwin AI busca alguien que automatice procesos con Claude Code y agentes conectados al stack |
| AI Agent Engineer (graduate) | Baja pero aparece en programas de graduados de TikTok, ByteDance, Motorola y Atento | Trainee o graduate, con fecha de inicio futura | Si, son programas universitarios | Python, algoritmos de agentes, LLM, a veces Java o C++. Titulos encontrados hoy: "AI Agent Engineer Graduate (TikTok Shop, 2027 Start)" y "Ingeniero(a) de Agentes de IA" en Atento Argentina |
| Forward Deployed Engineer / AI Solutions | Alta y crece rapido: 381 posteos en 14 companias, 729% interanual. Titulos hermanos: Deployment Strategist, Forward Deployed Software Engineer, AI Deployment Engineer | Mayormente senior, pero Palantir publica explicitamente "New Grad" e "Internship" | Si en Palantir: engineering degree preferido, con salida explicita a graduados 2027 | Software engineering solido, Python, APIs, trato con cliente y tolerancia a ambiguedad. Entran juniors por programas de new grad, no por postulacion abierta general |
| Data Engineer junior | Media-alta en volumen. Encontrada con frecuencia en las queries de trainee y junior | Hay titulos "Data Engineer I", "Associate Data Engineer", "Junior Data Engineer" | Frecuente | SQL, Python, ETL, Spark, dbt, cloud. Es la via de entrada mas tradicional y con mas titulos explicitos de junior |
| MLOps / ML Platform junior | Baja. La mayoria de los titulos son senior o staff | Senior o staff en la gran mayoria | Si, usualmente | Docker, Kubernetes, CI/CD, MLflow, Airflow, cloud. Dificil de entrar sin experiencia previa de infraestructura |

### Distribucion de seniority en los titulos de la muestra de LinkedIn

Sobre las 412 tarjetas unicas obtenidas hoy con la Guest Jobs API (17 queries, 30 tarjetas por query):

- Titulos con senal junior, entry, graduate, trainee, intern, associate o early career: **106 de 412 (25,7%)**.
- Titulos con senal senior, staff, principal o lead: **69 de 412 (16,7%)**.
- Titulos con senal mid o semi senior: **4 de 412 (1%)**.
- El resto no declara nivel en el titulo.

Esto coincide con Apiva, donde el **49,9% de los posteos de AI Engineer no declara nivel** en el titulo y solo el 1,5% dice entry level o junior (https://apiva.ai/reports/ai-engineer).

### Familias de titulo encontradas en las 412 tarjetas

- AI Engineer generico: 107 tarjetas.
- Machine Learning Engineer: 64 tarjetas.
- Agentes y automatizacion: 53 tarjetas.
- LLM, applied AI o GenAI: 35 tarjetas.
- Forward Deployed o Solutions: 31 tarjetas.
- Software Engineer con adjetivo AI: 30 tarjetas.
- Data Engineer: 26 tarjetas.
- AI Product: 24 tarjetas.
- Prompt Engineer: 23 tarjetas.
- MLOps o ML Platform: 23 tarjetas.
- Frontend o full-stack en el titulo: 2 tarjetas.

El dato del ultimo punto es importante: **el titulo "frontend" casi no aparece en las busquedas de AI**, pero el trabajo de frontend si aparece dentro de las descripciones de AI Product Engineer y Full-stack AI.

## Que piden realmente en las ofertas

### Metodologia

- Fecha de recoleccion: 28 de septiembre de 2026.
- Fuente primaria: Guest Jobs API publica de LinkedIn (`https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=<QUERY>&location=<LOC>&start=<N>`), con curl y user agent de navegador, sin login ni cookies. 2,5 segundos entre requests.
- Queries usadas (17 combinaciones, 3 paginas de 10 tarjetas cada una, 51 requests totales): junior AI engineer (Worldwide y Argentina), trainee AI (Worldwide), junior machine learning (Worldwide y Remote), AI engineer entry level (Worldwide), LLM engineer (Worldwide), AI product engineer (Worldwide), prompt engineer (Worldwide), AI developer junior (Worldwide), applied AI engineer (Worldwide), AI agent developer (Worldwide), AI automation engineer (Worldwide), MLOps engineer (Worldwide), data engineer junior (Worldwide), forward deployed engineer AI (Worldwide), AI engineer (Latin America).
- Resultado: **412 tarjetas unicas** (se deduplico por id de posteo).
- Muestra de descripciones: **N = 22 ofertas** con descripcion completa descargada desde `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{id}` (22 de 22 con exito, 2.033 a 10.416 caracteres por descripcion). De esas 22, **N = 14 tienen titulo entry-level** (junior, graduate, entry, associate, trainee, new grad) y las 8 restantes son de perfiles hibridos (AI Product Engineer, AI Automation Engineer, Applied AI, AI Engineer).
- Como se conto: se busco mencion de la tecnologia o concepto en el texto de la descripcion, sea en requisitos excluyentes o en deseables. Apiva aclara lo mismo para su corpus: "estas son menciones, no requisitos", y no separa "5+ anos requeridos" de "un plus" (https://apiva.ai/reports/ai-engineer).
- Limitacion de la muestra: N = 22 es pequeno y esta sesgado hacia ofertas en ingles y espanol que la API publica devuelve para estas keywords. Sirve para ver orden relativo y presencia, no para extrapolar porcentajes al mercado entero. Los porcentajes de mercado mas solidos vienen de Apiva (707 y 778 descripciones leidas).

### Frecuencia de requisitos en la muestra de LinkedIn (N = 22)

| Requisito | Menciones en N ofertas | Porcentaje |
|---|---|---|
| Python | 18 de 22 | 81,8% |
| Agentes, agentic, tool calling o MCP | 17 de 22 | 77,3% |
| Comunicacion, stakeholders o contexto de negocio | 15 de 22 | 68,2% |
| LLM APIs (OpenAI, Anthropic, Gemini, Azure OpenAI, Bedrock) | 12 de 22 | 54,5% |
| Deep learning, transformers, CV o NLP | 11 de 22 | 50,0% |
| RAG o retrieval | 10 de 22 | 45,5% |
| Testing (pytest, jest, unit test) | 10 de 22 | 45,5% |
| Titulo formal (degree, bachelor, master, PhD o equivalente) | 10 de 22 | 45,5% |
| LangChain, LangGraph o LangSmith | 9 de 22 | 40,9% |
| JavaScript o TypeScript | 8 de 22 | 36,4% |
| PyTorch | 8 de 22 | 36,4% |
| Cloud (AWS, GCP o Azure) | 8 de 22 | 36,4% |
| REST, APIs o microservicios | 8 de 22 | 36,4% |
| Docker o Kubernetes | 7 de 22 | 31,8% |
| CI/CD o IaC | 6 de 22 | 27,3% |
| Prompt engineering | 5 de 22 | 22,7% |
| Git | 5 de 22 | 22,7% |
| Data pipelines, ETL, Spark o Kafka | 5 de 22 | 22,7% |
| TensorFlow o Keras | 4 de 22 | 18,2% |
| LlamaIndex | 4 de 22 | 18,2% |
| Embeddings | 4 de 22 | 18,2% |
| Vector DB (Pinecone, Weaviate, Qdrant, Chroma, FAISS, pgvector) | 4 de 22 | 18,2% |
| MLOps, MLflow, W&B o Airflow | 4 de 22 | 18,2% |
| ML clasico (sklearn, XGBoost, regresion, clustering) | 3 de 22 | 13,6% |
| React o frontend | 3 de 22 | 13,6% |
| SQL | 2 de 22 | 9,1% |
| Evaluacion de LLMs (evals, guardrails, deteccion de regresion) | 2 de 22 | 9,1% |
| Fine-tuning (LoRA, PEFT, RLHF, DPO) | 1 de 22 | 4,5% |
| Full-stack | 1 de 22 | 4,5% |

### Frecuencia en el subconjunto entry-level de la muestra (N = 14)

| Requisito | Menciones | Porcentaje |
|---|---|---|
| Python | 12 de 14 | 85,7% |
| Agentes, agentic, tool calling o MCP | 11 de 14 | 78,6% |
| Deep learning, transformers, CV o NLP | 10 de 14 | 71,4% |
| Titulo formal | 10 de 14 | 71,4% |
| Comunicacion y negocio | 9 de 14 | 64,3% |
| Testing | 7 de 14 | 50,0% |
| PyTorch | 6 de 14 | 42,9% |
| RAG o retrieval | 6 de 14 | 42,9% |
| JavaScript o TypeScript | 5 de 14 | 35,7% |
| LangChain, LangGraph o LangSmith | 5 de 14 | 35,7% |
| LLM APIs | 5 de 14 | 35,7% |
| Cloud | 5 de 14 | 35,7% |
| Prompt engineering | 4 de 14 | 28,6% |
| Docker o Kubernetes | 4 de 14 | 28,6% |
| Vector DB | 1 de 14 | 7,1% |
| Evaluacion de LLMs | 1 de 14 | 7,1% |
| React o frontend | 1 de 14 | 7,1% |
| SQL | 0 de 14 | 0,0% |
| Fine-tuning | 0 de 14 | 0,0% |

Dos lecturas: en entry-level **el titulo formal pesa mucho mas (71,4% contra 45,5% del total)** y **la capa LLM aplicada (RAG, LangChain, LLM APIs) aparece pero por debajo de Python y de los fundamentos de deep learning**. El SQL y el fine-tuning practicamente no aparecen en las ofertas entry-level de esta muestra.

### Frecuencia de mercado en corpus grandes (verificado hoy)

Corpus de Apiva, 707 descripciones de AI Engineer leidas de 1.056 posteos vivos en EE.UU., septiembre 2026 (https://apiva.ai/reports/ai-engineer):

| Skill | % de menciones |
|---|---|
| Python | 68,4% |
| LLM | 52,8% |
| RAG | 34,7% |
| Machine learning | 32,0% |
| AWS | 27,2% |
| Prompt engineering | 19,7% |
| PyTorch | 18,6% |
| CI/CD | 16,7% |
| REST APIs | 16,7% |
| GCP | 16,6% |
| TypeScript | 16,6% |
| Azure | 15,9% |
| Kubernetes | 14,9% |
| Observabilidad | 13,3% |
| LangChain | 13,0% |
| Vector databases | 12,7% |
| Docker | 11,5% |
| SQL | 10,8% |
| Generative AI | 10,6% |
| Fine-tuning | 10,2% |
| TensorFlow | 10,2% |
| Deep learning | 9,5% |
| LangGraph | 9,3% |
| MLOps | 9,3% |

Corpus de Apiva para ML Engineer, 778 descripciones de 935 posteos (https://apiva.ai/reports/machine-learning-engineer): Python 75,8%, machine learning 53,9%, PyTorch 52,5%, LLM 33,7%, TensorFlow 32%, deep learning 29,2%, AWS 20,6%, C++ 19,3%, computer vision 16,5%, MLOps 15,4%, Kubernetes 14,5%, NLP 14,3%, data pipelines 13,6%, Spark 13,1%, CI/CD 12,7%, reinforcement learning 12,5%, SQL 12,1%, Docker 11,6%, scikit-learn 11,1%, RAG 10,4%.

Corpus de aidevboard, 9.846 posteos activos de AI en 549 companias al 17 de septiembre de 2026 (https://aidevboard.com/research/ai-jobs-report-2026): skills mas pedidas por cantidad de roles abiertos: agents 3.068, llm 2.944, cloud 1.991, generative-ai 1.784, distributed-systems 1.614, data-pipeline 1.129, pytorch 1.055, fine-tuning 953, deep-learning 750. Salarios por nivel: Junior 645 roles a USD 173k, Mid-Level 2.524 roles a USD 154k, Senior 3.320 roles a USD 218k, Lead 2.716 roles a USD 271k, Principal 641 roles a USD 352k. El 27% es remoto.

Corpus de axialsearch sobre ML engineering, 13.776 posteos de EE.UU. desde enero de 2026 (http://axialsearch.com/insights/ml-engineering-jobs): Python en 79%, deep learning 56%, cloud 42%, MLOps 29%, y **79% piden titulo**. Mediana salarial USD 197k.

Corpus de IT Jobs Watch para AI Engineer en el Reino Unido, 6 meses al 4 de septiembre de 2026 (https://www.itjobswatch.co.uk/jobs/uk/artificial%20intelligence%20engineer.do): 837 posteos permanentes contra 82 del mismo periodo de 2025 y 48 de 2024. Mediana GBP 87.500. Co-ocurrencias: AI 92,59%, Python 67,26%, Azure 54%, Software Engineering 31,9%, LLM 28,91%, RAG 18,28%, Generative AI 16,13%, Prompt Engineering 11,83%, AWS 10,75%, MLOps 10,75%.

### Requisitos excluyentes versus deseables observados

Excluyentes, lo que de verdad filtra:

- **Python.** Es lo unico que aparece por encima del 68% en todos los corpus consultados. Sin Python no hay entrada al rol de AI Engineer ni de ML Engineer.
- **Titulo formal en las rutas academicas.** En ML engineering el 79% lo pide (axialsearch) y en mi subconjunto entry-level de LinkedIn el 71,4% lo menciona. En cambio, para AI Engineer aplicado y para los roles de producto con LLM el titulo es mas flexible.
- **Experiencia previa de software engineering en produccion.** El articulo de The AI Engineer estima en 6 meses la transicion desde un rol de software engineering, porque lo que falta es solo la capa LLM APIs, RAG, agentes y evaluacion (https://medium.com/data-science-collective/how-to-break-into-ai-engineering-in-2026-without-starting-over-246ccdfab5c9).
- **Para FDE: trato con cliente.** El 99% de las descripciones lo piden (https://rungcode.io/reports/forward-deployed-engineer-jobs). Palantir exige ademas engineering degree y posibilidad de clearance de seguridad (https://jobs.lever.co/palantir/b4aa51a2-bc43-4d67-bf55-12db7feefb3a).

Deseables, lo que suma pero no descarta:

- LangChain, LangGraph o LlamaIndex. El framework cambia con frecuencia y varias ofertas dicen "o equivalente".
- Vector databases y embeddings. Aparecen en torno al 12,7% del corpus de Apiva y solo 1 de 14 en mi muestra entry-level.
- Prompt engineering. Ya no es un rol, es una linea dentro de la descripcion. Aparece en el 19,7% del corpus de Apiva.
- Evaluacion de LLMs, guardrails y deteccion de regresion. Poco frecuente en entry-level (1 de 14 en mi muestra) pero es lo que separa un demo de un sistema en produccion. La guia de KDnuggets lo trata como tarea de ingenieria de primera clase (https://www.kdnuggets.com/the-roadmap-to-becoming-an-llm-engineer-in-2026).
- Fine-tuning. Muy bajo: 10,2% en Apiva y 0 de 14 en mi muestra entry-level. La propia guia dice que la mayoria de los sistemas en produccion nunca llega al fine-tuning y que los primeros tres niveles son prompt engineering, few-shot y retrieval (https://medium.com/data-science-collective/the-8-week-roadmap-from-ml-engineer-to-ai-engineer-802456b1ad2e).

## Roles mas accesibles para un perfil frontend

Analisis con evidencia. El punto de partida es que el titulo "frontend" casi no aparece en las búsquedas de AI (2 de 412 tarjetas en mi muestra de LinkedIn), pero **el trabajo de frontend si esta dentro de las descripciones** de varios roles hibridos contratados hoy.

### 1. AI Product Engineer (el mas directo)

Es el rol donde el frontend con producto es la ventaja, no el deficit.

- Alma publica un "Product Engineer (AI)" que "diseña pipelines agentic y arquitecturas RAG y construye la interfaz React con la que el usuario interactua", y lo dice textual: "el ingeniero que disena el agente tambien construye la UI que lo expone". Agrega que "con las herramientas de AI modernas, la excusa tradicional de que el frontend no es mi fortaleza ya no se sostiene" y que hay que "construir con AI, no solo construir AI". Los requisitos son 2 o mas anos construyendo features de AI/LLM en produccion, fundamentos de RAG, prompt engineering, frameworks agentic, orquestacion LLM, sistemas de evaluacion (evals, human-in-the-loop, deteccion de regresion), Python, FastAPI, PostgreSQL, contenedores y microservicios (https://www.tealhq.com/job/product-engineer-ai_7ea1a30acc57318dbeb4d8a2470ebf1de9be9).
- Una oferta de AI Product Engineer recogida por Joblinking pide "fluidez en Next.js + React + TypeScript, comodidad tomando decisiones de UX", 1 o 2 anos "construyendo y enviando productos LLM orientados al usuario", y como bonus "haber iterado un producto a traves de evals y CI/CD" y "ser excelente comunicandose con AI (prompting)". Skills requeridas: TypeScript, React, Next.js por delante; Supabase y Postgres por detras (https://joblinking.com/ai-product-engineer/).
- Underdog.io describe el rol "AI Product Engineer (React)" como quien construye "streaming UI, chat interfaces, AI workflow builders y dashboards potenciados con LLM", con stack React, Streaming APIs y WebSockets, y anota que el full-stack cobra entre 15% y 25% mas que el frontend puro en startups de Nueva York (https://underdog.io/react-engineer-jobs-nyc).
- Business Insider documenta en abril de 2026 que Anthropic esta probando internamente "deputar a los ingenieros como mini PMs", con el jefe de growth Amol Avasare diciendo que los ingenieros ven ganancias de productividad de 2 a 3 veces con Claude Code y que el "product engineer" es el hibrido de PM e ingeniero de software (https://www.businessinsider.com/ai-jobs-product-engineers-managers-2026-4).

Requisito excluyente para este rol: poder mostrar un producto LLM en produccion con UI propia. Python ayuda pero en varias ofertas el backend puede ser Node o Supabase.

### 2. AI-native Frontend o Full-stack con LLM

- SimilarWeb busca "Senior Full Stack Engineer (Frontend-Oriented, AI-First Product Team)" con React, TypeScript, Vite y NestJS, y dentro de las responsabilidades tiene una seccion entera llamada "AI-Augmented Engineering": usar Cursor, Copilot, Claude y ChatGPT de forma efectiva, evaluar criticamente y mejorar el codigo generado por AI, disenar flujos de trabajo eficientes para el desarrollo asistido por AI, entender limitaciones, riesgos y tradeoffs de los sistemas basados en LLM. Pide 5 o mas anos y dominio experto de React, TypeScript, HTML y CSS (https://builtin.com/job/senior-full-stack-engineer-frontend-oriented-ai-first-product-team/9659174).
- CRED contrata "Frontend Engineer (React)" para su "AI Native Command Center": React, TypeScript, GraphQL, dashboards, agent UIs, extensiones de Chrome, e integracion con APIs GraphQL para exponer insights generados por LLM. Como bonus: experiencia con herramientas basadas en LLM o plataformas AI internas (https://talents.studysmarter.co.uk/companies/cred/frontend-engineer-react-remote-11038425).
- En la muestra de LinkedIn de hoy aparece "AI Engineer (SSR), Python, Azure OpenAI, LLMs (Hibrido)" en Talent Connect para Buenos Aires, y "Software Engineer, AI, Python" en Telnyx para Argentina, ambos con salida a perfil de software engineering con capa LLM (https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=junior%20AI%20engineer&location=Argentina&start=0).

Requisito excluyente: TypeScript y React de nivel senior, mas al menos un caso de uso de LLM integrado en una interfaz real.

### 3. AI Automation Engineer y AI Agent Developer (la via con menos friccion)

Es la ruta donde menos compite con ingenieros de ML formales, porque el trabajo es orquestar agentes e integrar herramientas, no entrenar modelos.

- Darwin AI, en Gran Buenos Aires, busca "AI Automation Engineer (Growth)" con la descripcion mas explicita del mercado argentino de hoy: entender y documentar procesos de marketing de punta a punta, automatizarlos "usando una combinacion de Claude Code, Claude Cowork y agentes de AI conectados a nuestro stack", construir la plomeria de datos entre Google Ads, Meta Ads, HubSpot, Linear, Slack, Google Calendar, Figma y Canva, y entregar herramientas y dashboards que el equipo use todos los dias (https://www.linkedin.com/jobs/view/4412943940).
- Universia Argentina publica "AI Product Engineer" para Fex, una startup que monta dos agentes de AI sobre el ERP del cliente, y dice como trabajan: "AI-first de verdad: usamos AI todos los dias para shippear mas rapido. Claude Code y otros agentes son parte real del workflow, no un experimento", con "ownership end-to-end, del spec al deploy" (https://www.linkedin.com/jobs/view/4457359889).
- Clara, en Buenos Aires hibrido, publica "AI Growth Automation Engineer" (https://www.linkedin.com/jobs/view/4460509741).
- Atento, en Gran Buenos Aires, publica "Ingeniero(a) de Agentes de IA (AI Agent Engineer)" (query "junior AI engineer" con location Argentina, verificada hoy).
- El listado de Landed documenta que la definicion del rol de AI Engineer es "construir productos sobre LLMs: RAG, agentes, evals, inferencia", y que "la mayoria de los roles quieren capacidad de enviar producto (Python, LangChain o LlamaIndex, vector DBs, APIs), no un PhD de ML" (https://github.com/landedjobs/ai-engineer-jobs).

Requisito excluyente: demostrar un flujo de agentes funcionando de punta a punta, con herramientas reales, y hablar con claridad del proceso de negocio que se automatiza.

### Combinacion de skills que mas valoran las empresas para este cruce

Ordenado por lo observado en las ofertas citadas arriba y en la muestra de N = 22:

1. **Frontend de produccion** (React, TypeScript, Next.js o GraphQL) con anos reales de producto.
2. **Uso intensivo y critico de AI tooling en el dia de trabajo** (Copilot, Claude Code, OpenCode, Cursor), no como experimento sino como forma principal de trabajar.
3. **Construccion de al menos un sistema LLM en produccion**: RAG, agentes, tool calling, streaming de respuestas.
4. **Evaluacion y calidad del output**: evals, human-in-the-loop, deteccion de regresion, guardrails. Es lo que las ofertas senior mencionan y casi ninguna oferta entry menciona, o sea que es el diferencial.
5. **Capacidad de hablar con el cliente y entender el proceso de negocio**, sobre todo en FDE y en AI Automation.
6. **Python al nivel de poder leer y mantener servicios backend**, aunque el rol sea de frontend.

## Que se discute en la comunidad

Aclaracion: los backends con login de agent-reach no estan conectados, asi que no se pudo abrir Reddit ni X con sesion. Lo que sigue son fragmentos obtenidos por websearch y, cuando fue posible, por Jina Reader. Se marca explicitamente que quedo sin verificar.

- **Reddit, r/cscareerquestions, "So, how are we juniors meant to upskill in this new AI market?"** (publicado hace aproximadamente un mes, es decir alrededor de agosto de 2026). Un junior frontend con 1 ano de experiencia en un banco describe la duda de si conviene seguir codeando a mano o volcarse a AI, y dice que el roadmap para juniors desaparecio. Verificado parcialmente: el texto del post se leyo via websearch y Jina Reader, pero **no se pudieron leer las respuestas** porque Reddit exige sesion (https://www.reddit.com/r/cscareerquestions/comments/1seomw4/so_how_are_we_juniors_meant_to_upskill_in_this).
- **Quartz, "AI productivity fads, from prompt engineering to tokenmaxxing"** (12 de junio de 2026). Cuenta el ciclo completo del prompt engineer: la oferta de Anthropic de marzo de 2023 con rango de USD 175k a 335k, el pico de busquedas en Indeed de 2 por millon en enero de 2023 a 144 por millon en abril de 2023, y la caida a 20 o 30 por millon despues. Una encuesta de Microsoft a 31.000 trabajadores de 31 paises ubica a prompt engineer en el penultimo puesto entre los nuevos roles que las companias planeaban sumar. La conclusion: "prompt engineering se volvio una skill, no una carrera" (https://qz.com/prompt-engineering-tokenmaxxing-ai-productivity-fads-history-061126).
- **RezScore, "The 2026 job market: what the data actually shows"** (5 de enero de 2026). Sobre 66.785 CVs, solo 5 personas listan "Prompt Engineer" como titulo laboral. Sobre posteos, 7.359 mencionan prompt engineering contra 137.176 de Python y 77.214 de Machine Learning. Salario promedio de la skill: USD 164.840, lo que el articulo interpreta como la firma de un add-on valioso, no de una funcion principal (https://blog.rezscore.com/the-2026-job-market-what-the-data-actually-shows).
- **PE Collective, "Is Prompt Engineering a Real Career in 2026?"** (22 de abril de 2026). Sostiene lo contrario con datos de su job board de 1.300 profesionales: los roles que piden skills de prompt engineering sin importar el titulo crecieron 3 veces entre 2024 y 2026, y los salarios subieron en vez de caer. Los tres caminos que identifica son AI Engineer (via tecnica), AI Product Manager o Solutions Consultant (via producto) y AI Trainer o Evaluator (via de calidad de datos) (http://pecollective.com/blog/is-prompt-engineering-a-real-career).
- **HackerNoon, "MCP Was Declared Dead"** (2026). Recorre el vaiven del protocolo MCP: 97 millones de descargas mensuales del SDK y mas de 10.000 servidores publicos activos reportados en diciembre de 2025, un informe de GitGuardian con 24.008 secretos expuestos en archivos de configuracion de MCP en GitHub publico (2.117 aun validos al momento del escaneo), una auditoria de abril de 2026 sobre 1.847 servidores publicos que hallo el 52% abandonados, y la reconstruccion del spec del 28 de julio de 2026. Simon Willison y Charles Chen revirtieron sus criticas hacia julio y agosto de 2026 (https://hackernoon.com/mcp-was-declared-dead).
- **Milvus Blog, "Is MCP Dead? MCP vs CLI vs Agent Skills Compared"** (1 de abril de 2026). Recoge las declaraciones del CTO de Perplexity, Denis Yarats, depriorizando MCP internamente, y de Garry Tan diciendo que MCP consume mucho context window y que armo un reemplazo CLI en 30 minutos. La posicion del articulo es que las Agent Skills ganan por divulgacion progresiva y que el CLI sirve para ejecutar mientras las Skills codifican logica de flujo (https://milvus.io/blog/is-mcp-dead-cli-and-skills-for-ai-agents.md).
- **developersdigest, "What Hacker News Gets Right About AI Coding Agents in 2026"**. Resume cuatro verdades que se repiten en los hilos de Hacker News: los flujos de trabajo importan mas que las demos, la verificacion es el cuello de botella, las skills ganan a los prompts, y la orquestacion importa mas que la autonomia bruta (https://www.developersdigest.tech/blog/what-hacker-news-gets-right-about-ai-coding-agents-2026).
- **Hacker News, "Who Wants to Be Hired? (May 2026)"**. Se ve el formato en que se presentan los candidatos: se autodescriben como "AI Product Engineer especializado en workflows agenticos autonomos" y citan un proyecto multimodal con RAG y latencia casi nula (https://news.ycombinator.com/item?id=48283927).
- **X, dos posts de julio y agosto de 2026**. Uno afirma "prompt engineering is dead" y propone cinco proyectos de fin de semana centrados en MCP, agent swarms, contexto local, evals y micro-SaaS. Otro lista 15 skills de AI agent engineer incluyendo MCP, vector databases, AI evaluation, guardrails, observabilidad y human-in-the-loop. **Verificado solo como snippet de busqueda: no se pudo abrir X con sesion** (https://x.com/suraj_sharma14/status/2074508747150590167 y https://x.com/Origin_AI_01/status/2084587994040664353).

### Repos de referencia de AI engineering (verificado hoy contra la API de GitHub)

Lo que se ensena y se usa se concentra en la capa de aplicacion sobre LLMs, no en el entrenamiento de modelos:

| Repo | Estrellas | Tema |
|---|---|---|
| `rohitg00/ai-engineering-from-scratch` | 57.513 | Ingenieria de AI desde cero, con salida a produccion |
| `patchy631/ai-engineering-hub` | 38.024 | Tutoriales de LLMs, RAG y agentes de AI reales |
| `deepset-ai/haystack` | 26.600 | Orquestacion de AI para produccion |
| `chiphuyen/aie-book` | 17.545 | Recursos para AI engineers (libro de Chip Huyen) |
| `dair-ai/Prompt-Engineering-Guide` | 78.629 | Guia de prompt engineering, contexto e ingenieria de instrucciones |
| `langchain-ai/langchain` | 147.061 | Plataforma de ingenieria de agentes |
| `langgenius/dify` | 157.220 | Flujos agentic y pipelines RAG |
| `Shubhamsaboo/awesome-llm-apps` | 139.773 | Mas de 100 apps de agentes, Agent Skills y RAG |
| `microsoft/generative-ai-for-beginners` | 120.559 | 21 lecciones de generative AI |

Fuente de las estrellas y descripciones: API de GitHub, consulta del 28 de septiembre de 2026 (`https://api.github.com/search/repositories?q=<QUERY>&sort=stars&order=desc`).

## Mercado argentino y de LatAm

- **Volumen.** La query "junior AI engineer" con location Argentina devolvio 30 tarjetas hoy, de las cuales 20 son de Buenos Aires o Gran Buenos Aires y el resto de Argentina sin ciudad o del interior. Empresas con presencia en la muestra: Mercado Libre, Accenture Argentina, PwC Argentina, AlixPartners, Clara, Darwin AI, Telnyx, Beyond, BairesDev, Atento, Netrix Global, Nosis, ZS (query verificada hoy via Guest Jobs API).
- **Titulos locales observados.** "Semi senior, Ingenieria de IA Generativa" (PwC Argentina), "Analista de Ingenieria de Datos e IA, Fintech" (Mercado Libre), "AI Workflow Engineer LATAM" (Backblaze), "Ingeniero(a) de Agentes de IA" (Atento), "AI Product Engineer" (Universia Argentina), "AI-Native Software Engineer, Early Career" (ChainGPT), "AI Growth Automation Engineer" (Clara).
- **Salarios entry de AI/ML en Argentina.** Una guia de contratacion nearshore situa el rango junior de 0 a 2 anos entre USD 1.500 y 3.150 mensuales en Argentina, contra USD 7.333 y 11.500 del equivalente estadounidense (https://nearshorebusinesssolutions.com/ai-ml-engineers). Otra fuente da USD 2.500 a 3.800 mensuales para junior de ML en LatAm (https://www.hirewithnear.com/find-a-hire/machine-learning-engineer).
- **Bandas locales en pesos.** Nucamp publica para 2026 bandas de base anual bruta en millones de pesos argentinos: ML Engineer de entrada entre 28 y 35, AI Engineer o especialista GenAI de entrada entre 30 y 38, MLOps de entrada entre 32 y 40. Un AI developer mid en Argentina se ubica en 45 a 60 millones anuales, equivalente a unos USD 40k a 50k, y los perfiles AI/ML tienen un premio de 25% a 50% sobre desarrolladores generalistas (https://www.nucamp.co/blog/coding-bootcamp-argentina-arg-top-10-best-paid-tech-job-in-argentina-in-2025).
- **Oferta regional.** GetOnBoard publica un "Senior AI Engineer" remoto para Sudamerica y Centroamerica a USD 3.000 a 3.500 brutos mensuales (https://www.getonbrd.com.co/jobs/machine-learning-ai/senior-ai-engineer-niuro-remote-3595).
- **Salarios AI en Argentina segun SalaryExpert**: promedio de 41.208.139 pesos brutos anuales para Machine Learning Engineer al 26 de agosto de 2026 (https://www.salaryexpert.com/salary/job/machine-learning-engineer/argentina).

## Limitaciones de la investigacion

- **Backends con login de agent-reach no conectados.** Se verifico con `agent-reach doctor --json` que la extension OpenCLI no esta conectada en este entorno. Por eso no se pudo leer Reddit, Twitter ni X con sesion. Los threads de foro se citan desde snippets de websearch y, cuando fue posible, Jina Reader. Queda sin verificar: el contenido completo de las respuestas del hilo de r/cscareerquestions y el contenido completo de los dos posts de X citados.
- **Muestra pequena de descripciones.** N = 22 ofertas con descripcion completa, de las cuales N = 14 son entry-level. Sirve para ver orden relativo y presencia de requisitos, no para extrapolar porcentajes al mercado. Los porcentajes de mercado mas representativos vienen de Apiva (707 descripciones de AI Engineer y 778 de ML Engineer) y se citan aparte.
- **Sesgo de la fuente.** La Guest Jobs API de LinkedIn devuelve tarjetas publicas para las keywords usadas, con sesgo hacia empresas grandes y programas de graduados (TikTok, ByteDance, SAP, Accenture, Deloitte, IBM). Las startups chicas y las busquedas por referencia quedan subrepresentadas.
- **Sesgo geografico.** Las queries se corrieron con Worldwide, Argentina, Latin America y Remote. No se cubrio Asia ni Europa en profundidad, salvo lo que la API devolvio de forma espontanea.
- **Verificado hoy versus reportado por.** Se marco con URL cada cifra. Las cifras de aidevboard, axialsearch, Nucamp, Hire With Near y NBS se tomaron de los resumenes de busqueda y se citan como "reportado por", salvo Apiva, Rung, Landed, GitHub, CNBC, Medium, Quartz, RezScore, HackerNoon, Milvus, Business Insider, IT Jobs Watch, Teal, Built In, Joblinking y Underdog, que se abrieron y se leen como verificados hoy.
- **No se incluyo nada del CV del candidato ni de la carpeta privada (`privado`; antes `enchula-mi-resume-privado-no-commit`).** Este documento es de mercado.
- **Fechas de los reportes externos.** Cada fuente declara su fecha: Apiva septiembre 2026, Rung septiembre 2026, aidevboard 17 de septiembre de 2026, Landed actualizado al 25 de julio de 2026, RezScore 5 de enero de 2026, IT Jobs Watch al 4 de septiembre de 2026. Donde una cifra no tenia fecha, se marco "no verificado".

## Fuentes

Verificadas hoy con fetch, API o curl:

- Guest Jobs API de LinkedIn, listados: `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=<QUERY>&location=<LOC>&start=<N>`
- Guest Jobs API de LinkedIn, detalle: `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{id}`
- Paginas de ofertas citadas: `https://www.linkedin.com/jobs/view/4412943940` (Darwin AI), `https://www.linkedin.com/jobs/view/4457359889` (Universia Argentina), `https://www.linkedin.com/jobs/view/4460509741` (Clara), `https://www.linkedin.com/jobs/view/4470312060` (Lear Labs)
- Apiva, AI Engineer job market report, septiembre 2026: https://apiva.ai/reports/ai-engineer
- Apiva, Machine Learning Engineer job market report, septiembre 2026: https://apiva.ai/reports/machine-learning-engineer
- Landed, ai-engineer-jobs (GitHub): https://github.com/landedjobs/ai-engineer-jobs
- Rung, Forward Deployed Engineer jobs report, septiembre 2026: https://rungcode.io/reports/forward-deployed-engineer-jobs
- CNBC, "AI is killing the grunt work, forcing companies to rethink entry-level hiring", 23 de septiembre de 2026: https://www.cnbc.com/2026/09/23/ai-workplace-graduate-entry-level-junior-hiring.html
- CNBC, "Entry-level jobs calling for AI skills nearly doubled from a year ago", 29 de abril de 2026: https://www.cnbc.com/amp/2026/04/29/entry-level-jobs-calling-for-ai-skills-nearly-doubled-from-a-year-ago-report.html
- Medium (Data Science Collective), "How to Break Into AI Engineering in 2026 (Without Starting Over)", 1 de abril de 2026: https://medium.com/data-science-collective/how-to-break-into-ai-engineering-in-2026-without-starting-over-246ccdfab5c9
- Medium (Data Science Collective), "The 8-Week Roadmap From ML Engineer to AI Engineer", 9 de mayo de 2026: https://medium.com/data-science-collective/the-8-week-roadmap-from-ml-engineer-to-ai-engineer-802456b1ad2e
- RezScore, "The 2026 job market: what the data actually shows", 5 de enero de 2026: https://blog.rezscore.com/the-2026-job-market-what-the-data-actually-shows
- Quartz, "AI productivity fads, from prompt engineering to tokenmaxxing", 12 de junio de 2026: https://qz.com/prompt-engineering-tokenmaxxing-ai-productivity-fads-history-061126
- Business Insider, "The next big job in tech may be the 'product engineer'", 6 de abril de 2026: https://www.businessinsider.com/ai-jobs-product-engineers-managers-2026-4
- HackerNoon, "MCP Was Declared Dead": https://hackernoon.com/mcp-was-declared-dead
- Milvus Blog, "Is MCP Dead? MCP vs CLI vs Agent Skills Compared", 1 de abril de 2026: https://milvus.io/blog/is-mcp-dead-cli-and-skills-for-ai-agents.md
- developersdigest, "What Hacker News Gets Right About AI Coding Agents in 2026": https://www.developersdigest.tech/blog/what-hacker-news-gets-right-about-ai-coding-agents-2026
- Teal, "Product Engineer, AI, Alma": https://www.tealhq.com/job/product-engineer-ai_7ea1a30acc57318dbeb4d8a2470ebf1de9be9
- Built In, "Senior Full Stack Engineer (Frontend-Oriented, AI-First Product Team), SimilarWeb": https://builtin.com/job/senior-full-stack-engineer-frontend-oriented-ai-first-product-team/9659174
- Joblinking, "AI Product Engineer": https://joblinking.com/ai-product-engineer/
- Underdog.io, "React Engineer Jobs NYC": https://underdog.io/react-engineer-jobs-nyc
- StudySmarter Talents, "Frontend Engineer (React), CRED": https://talents.studysmarter.co.uk/companies/cred/frontend-engineer-react-remote-11038425
- IT Jobs Watch, "Artificial Intelligence Engineer" (Reino Unido, 6 meses al 4 de septiembre de 2026): https://www.itjobswatch.co.uk/jobs/uk/artificial%20intelligence%20engineer.do
- Open Data Science, "The 12 Most In-Demand AI Job Roles in 2026": https://opendatascience.com/12-in-demand-ai-job-roles-2026-how-to-get-hired/
- KDnuggets, "The Roadmap to Becoming an LLM Engineer in 2026", 16 de junio de 2026: https://www.kdnuggets.com/the-roadmap-to-becoming-an-llm-engineer-in-2026
- Palantir, Forward Deployed Software Engineer New Grad (Lever): https://jobs.lever.co/palantir/b4aa51a2-bc43-4d67-bf55-12db7feefb3a
- fdecareers.ai, Palantir Forward Deployed Engineer Jobs: https://fdecareers.ai/companies/palantir
- API de GitHub, busqueda de repositorios: `https://api.github.com/search/repositories?q=<QUERY>&sort=stars&order=desc`

Reportadas por (resumen de busqueda, no abierto en su totalidad):

- aidevboard, "AI Developer Jobs Report 2026", 17 de septiembre de 2026: https://aidevboard.com/research/ai-jobs-report-2026
- axialsearch, "The State of the ML Engineering Job Market in 2026": http://axialsearch.com/insights/ml-engineering-jobs
- axialsearch, "Inside the AI Engineering Job Market: 43,500 Postings Analyzed": http://axialsearch.com/insights/ai-engineering-jobs
- PE Collective, "Is Prompt Engineering a Real Career in 2026?", 22 de abril de 2026: http://pecollective.com/blog/is-prompt-engineering-a-real-career
- Nearshore Business Solutions, "Hire AI/ML Engineers in Latin America": https://nearshorebusinesssolutions.com/ai-ml-engineers
- Hire With Near, "Hire Machine Learning Engineers in LatAm": https://www.hirewithnear.com/find-a-hire/machine-learning-engineer
- Nucamp, "AI Salaries in Argentina in 2026", 7 de abril de 2026: https://www.nucamp.co/blog/coding-bootcamp-argentina-arg-top-10-best-paid-tech-job-in-argentina-in-2025
- SalaryExpert, "Machine Learning Engineer Salary in Argentina (2026)": https://www.salaryexpert.com/salary/job/machine-learning-engineer/argentina
- GetOnBoard, "Senior AI Engineer en Niuro": https://www.getonbrd.com.co/jobs/machine-learning-ai/senior-ai-engineer-niuro-remote-3595
- AOL / Business Insider, "Job postings for this tech role have grown more than 700% in the last year", 18 de mayo de 2026: https://www.aol.com/news/job-postings-tech-role-grown-185134480.html
- TechTarget, "The rise of the AI forward-deployed engineer", 2 de julio de 2026: https://www.techtarget.com/ai/feature/The-rise-of-the-AI-forward-deployed-engineer
- AI Weekly / TechTimes, "ML Roles Surge 59% as Tech Cuts Hit 148,092 in 2026", 2 de junio de 2026: https://aiweekly.co/alerts/ml-roles-surge-59-as-tech-cuts-hit-148092-in-2026
- IABAC, "AI Engineer Jobs in the USA in 2026": https://iabac.org/blog/ai-engineer-jobs-in-the-usa
- Skillenai, "RAG jobs in 2026": https://skillenai.com/data/skill/rag
- Reddit, r/cscareerquestions, "So, how are we juniors meant to upskill in this new AI market?": https://www.reddit.com/r/cscareerquestions/comments/1seomw4/so_how_are_we_juniors_meant_to_upskill_in_this (parcialmente verificado, respuestas sin leer)
- X, post de Suraj Sharma de julio de 2026: https://x.com/suraj_sharma14/status/2074508747150590167 (sin verificar, solo snippet)
- X, post de OriginAI de agosto de 2026: https://x.com/Origin_AI_01/status/2084587994040664353 (sin verificar, solo snippet)
