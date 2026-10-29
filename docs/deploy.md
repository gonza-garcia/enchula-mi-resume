# Guía de deploy

El sitio es estático: Astro genera HTML, CSS y JavaScript en `dist/` y cualquier host
estático sirve. El camino probado es Cloudflare Pages; Vercel, Netlify o GitHub Pages
funcionan igual porque no hay server que mantener.

**Lo que se publica es el producto genérico, nunca los datos del usuario.** El deploy
sale del repo público (`gonza-garcia/enchula-mi-resume`), que solo tiene contenido demo
ficticio. La instancia con datos reales es privada y su build personal no se publica.

## Build

```bash
pnpm install
pnpm run build            # build genérico: el único publicable
pnpm run build:personal   # build con datos reales: solo local, jamás se publica
```

**`pnpm run build` genera siempre el build genérico**: perfil y plan de ejemplo y solo las
ofertas marcadas como `demo: true`. Escribe en `dist/` y ese directorio es lo único que se
puede publicar: por construcción no contiene datos personales.

**`pnpm run build:personal` genera el build con los datos reales del usuario** y escribe en
`dist-personal/`. Sirve para ver cómo se ve el CV con datos reales o para exportar desde un
build. No se publica nunca.

- Los dos builds escriben en carpetas distintas, así que nunca se pisan.
- Ambos validan los contratos (perfil y plan) con Zod y fallan ruidosamente si los datos
  están mal formados.
- El perfil real se escribe con `skills/job-seeking/build-profile` y se ve con
  `pnpm run dev`, que es la app viva con los datos del usuario.
- El header muestra un aviso no invasivo según el modo: "Datos de ejemplo, no son datos
  reales" en el build genérico y "Build local con datos reales. No publicar." en el
  personal. En el dev server no hay aviso.

## Cloudflare Pages (probado)

1. Conectar el **repo público** en Cloudflare Pages (no la instancia privada).
2. Build command: `pnpm run build`. Output directory: `dist/`.
3. Node version: la del repo (`.nvmrc` si existe; si no, Node 20 o superior).
4. El deploy corre en cada push a la rama principal.

## Cualquier otro host estático

El único requisito es servir `dist/` con HTTPS. Notas comunes:

- Servir `index.html` ante rutas desconocidas no hace falta: el sitio genera una carpeta por
  página (`/index.html`, `/interview/index.html`, `/learning/index.html`).
- La tab "CVs adaptados" de "Mis CVs" es una herramienta local de trabajo: sus flujos de
  creación de ofertas viven en el dev server (ADR-0023). En el sitio publicado no hay
  backend de ofertas.
- Si el host permite headers, mantener el cache de los assets con hash y el HTML sin cache
  largo.

## Variables de entorno del build

- `BUILD_MODE=personal` arma el build con datos reales y escribe en `dist-personal/`. Lo
  setea `pnpm run build:personal`; no hace falta usarlo a mano.
- `OFFERS_SOURCE=demo|local` decide qué ofertas entran al listado: `demo` solo las marcadas
  con `demo: true` en el frontmatter, `local` todas. Por defecto es `local` en el dev server
  y `demo` en un build de producción.
- `PROFILE_SOURCE=example` fuerza el perfil demo aunque exista un `profile.json` local.
- `PLAN_SOURCE=example` fuerza el plan demo aunque exista un `learning-plan.json` local.
- `E2E_DEMO=1` cambia el directorio de salida a `dist-e2e` (lo usa la suite E2E).

## Qué se publica y qué no

- **Publicable**: el build genérico (`dist/`), con datos demo y ofertas demo.
- **No publicable**: `dist-personal/`, y todo lo que hay en `docs/job-offers/` de la
  instancia cuando son ofertas reales (offer.md, match-report.md, adapted-resume.json y
  cover-letter.md del usuario). Es material de trabajo local y vive en el repo privado.
- En el repo público solo existen ofertas demo (fixtures ficticias), marcadas con
  `demo: true`.
