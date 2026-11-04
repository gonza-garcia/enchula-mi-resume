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

## Alcance de cada barrido

- **Todas las fuentes activas del catálogo, siempre.** Un barrido cubre el catálogo
  completo (las fuentes con `activa: false` se saltean y se listan como tales); nada de
  barrer solo un subconjunto.
- **Fuentes prioritarias primero.** Las fuentes con `prioridad: true` en el catálogo
  (empresas que el usuario valora y donde tiene referentes) se barren primero y sus
  vacantes van **señaladas** en el registro y en el reporte.
- **Nada bloquea el barrido.** Si una herramienta falla o una fuente necesita interacción
  del usuario (login, captcha, sesión), se registra la fuente como `sin acceso` con la
  causa y **se sigue con las demás**. Las ayudas que hagan falta se piden recién al final,
  después del reporte, para no frenar la pasada.

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

**Radar y antigüedad:** además del estado, cruzar contra los barridos anteriores (mismo
`idVacante`, misma URL o mismo contenido) y completar `enRadarDesde` con el id del primer
barrido donde apareció. El reporte debe poder responder "¿ya estaba en el radar?, ¿desde
cuándo?, ¿se capturó o no?": una vacante que da vueltas hace varios barridos se señala
como tal (y si venció su frescura o su ventana, va a `descartada` con ese motivo).

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

### 7. Reportar en el chat (siempre al terminar)

Con el barrido ya registrado en disco, mostrar **una tabla en el chat** con una fila por
fuente y estas columnas:

| Fuente | Acceso | Frutos | Notas |
|---|---|---|---|
| `<nombre>` | OK / sin acceso + causa | nuevas / capturadas / descartadas / nada | en el radar desde X, prioritaria, etc. |

Más un resumen corto (totales: fuentes barridas vs inaccesibles, vacantes nuevas,
capturadas y descartadas, y las vacantes prioritarias si las hubo). La tabla refleja
exactamente lo registrado en el JSON del barrido.

**Ayuda al usuario, solo al final:** si hubo fuentes sin acceso o que requieren
interacción (herramienta rota, login, captcha, file chooser), pedirlo recién después de
mostrar la tabla, listando qué se necesita por fuente. Nunca interrumpir el barrido para
pedir ayuda: una fuente que falla se registra y la pasada sigue.

## Criterio de completado

El barrido existe en disco con todas las vacantes de la pasada y sus estados (con
`enRadarDesde` cuando aplica), las descartadas con motivo, las particularidades anotadas,
el playbook de las fuentes actualizado si corresponde, `pnpm run check && pnpm run build`
en verde, **y la tabla del reporte mostrada en el chat** con las ayudas pedidas al final
si las hubo.
