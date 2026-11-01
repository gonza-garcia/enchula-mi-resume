---
name: register-sweep
description: Registrar un barrido de busqueda de ofertas y actualizar el playbook de sus
  fuentes: escribir docs/job-search/sweeps/<YYYY-MM-DD>-<id>.json con las fuentes
  barridas, las vacantes encontradas (id estable + estado) y las particularidades nuevas
  del proceso de captura. Usar cuando el usuario termine un barrido y pida registrarlo,
  o cuando la app del CV genere un prompt que referencia esta skill. NO captura ofertas
  (eso es capture-job-offer) ni ejecuta la busqueda: solo registra lo encontrado.
---

# Register Sweep

Registrar un barrido del pipeline de búsqueda: qué fuentes se barrieron, qué vacantes
se encontraron (con su id estable y su estado frente a lo ya capturado/postulado), qué
se descartó y por qué, y las particularidades nuevas del proceso de captura, que
actualizan el playbook de la fuente. Deja el registro en
`docs/job-search/sweeps/<YYYY-MM-DD>-<id>.json` (ADR-0043) y mejora
`docs/job-search/sources/<id>.json`.

## Contrato y límites

- **Dueña de**: el contrato de barridos (`docs/job-search/sweeps/`, ADR-0043) y de las
  particularidades del playbook de fuentes (`docs/job-search/sources/<id>.json`).
- **Escribe**: un `sweeps/<YYYY-MM-DD>-<id>.json` por barrido y, cuando hay
  particularidades nuevas, los `quirks`/`notas` de la fuente en `sources/<id>.json`.
- **No toca**: `docs/job-offers/` (capturar ofertas es capture-job-offer; el
  `application.md` lo escribe el flujo de postulación), ni el perfil, ni el banco, ni el
  plan de estudios.

## Modo de operación

- **Modo app**: el prompt pide devolver SOLO un bloque JSON del barrido. No escribas
  archivos salvo que el prompt lo pida explícitamente.
- **Modo directo**: el usuario pide registrar el barrido. Aplicás todos los pasos,
  incluido el guardado en disco y la validación en build.

## Pasos

### 1. Leer las fuentes y lo ya hecho

Leer `docs/job-search/sources/*.json` (las fuentes barridas, con su playbook) y
releer `docs/job-offers/*/offer.md` + sus `application.md`: los vínculos
`id_vacante`, `url`/`url_alternativa` y los `application.md` son los que definen si una
vacante **ya se capturó** o **ya se postuló** (mismo cruce que el chequeo de
duplicados del ADR-0038).

### 2. Resolver el estado de cada vacante encontrada

Para cada vacante del barrido, con su id estable (job id externo si existe, o
`empresa + título` / hash de la URL):

- `nueva`: no aparece en lo capturado.
- `capturada`: se capturó en este mismo barrido (tiene slug nuevo).
- `ya capturada`: ya existe su carpeta (coincide por id_vacante, URL o contenido).
- `ya postulada`: además tiene `application.md` (mostrar fecha y estado).
- `descartada`: no se captura, con `motivo` obligatorio (nivel, geo, stack, veto del
  usuario...). Los descartes sin carpeta viven solo en este registro.

### 3. Anotar las particularidades y actualizar el playbook

Cualquier maña nueva descubierta al buscar/capturar en una fuente (un authwall, un
campo raro del form, un rate limit, un agregador desactualizado) va en
`particularidades` del barrido **y** se incorpora a los `quirks`/`notas` de la fuente en
`sources/<id>.json` (si repite lo ya escrito, no duplicar). Es la mejora continua del
playbook: lo que hoy sabe solo la sesión de turno queda en disco.

### 4. Validar

Chequear antes de escribir: cada vacante con `idVacante` único dentro del barrido,
estados solo del contrato (`nueva | capturada | ya capturada | ya postulada |
descartada`), `motivo` presente en toda descartada, `sourceId` existente en el catálogo,
`capturadas` = slugs reales de `docs/job-offers/`, fechas `YYYY-MM-DD` y textos en
español sin em-dashes, en-dashes ni flechas.

### 5. Guardar en disco (modo directo, o cuando el prompt de la app lo pida)

Escribir `docs/job-search/sweeps/<YYYY-MM-DD>-<id>.json` con esta forma y correr
`pnpm run check && pnpm run build` para validar:

```json
{
  "id": "YYYY-MM-DD-corto",
  "fecha": "YYYY-MM-DD",
  "fuentes": [
    { "sourceId": "id-de-la-fuente", "resultados": 0, "nuevas": 0, "yaCapturadas": 0, "yaPostuladas": 0, "descartadas": 0 }
  ],
  "vacantes": [
    {
      "idVacante": "id-estable",
      "titulo": "Titulo de la vacante",
      "empresa": "Empresa o null",
      "sourceId": "id-de-la-fuente",
      "estado": "nueva | capturada | ya capturada | ya postulada | descartada",
      "motivo": "solo si descartada",
      "slug": "solo si capturada o ya capturada"
    }
  ],
  "capturadas": ["slug-de-oferta"],
  "particularidades": ["maña nueva del proceso de captura"]
}
```

Los campos de conteo (`resultados`, `nuevas`, etc.) son opcionales; el detalle de
`vacantes` es lo que cuenta. Si la oferta es ficticia (demo), agregar `"demo": true`.

### 6. Declarar la captura de cada oferta nueva

Por cada vacante `capturada`, el `offer.md` correspondiente debe llevar en el
frontmatter `fuente`, `barrido` (este id) e `id_vacante`. Si la captura la hizo
capture-job-offer sin esos campos, parchearlos (el frontmatter es dueña
capture-job-offer; solo se agregan esos tres campos, nada más).

## Criterio de completado

El barrido existe en disco con todas las vacantes de la pasada y sus estados, las
descartadas con motivo, las particularidades anotadas, el playbook de las fuentes
actualizado si corresponde, y `pnpm run check && pnpm run build` en verde.
