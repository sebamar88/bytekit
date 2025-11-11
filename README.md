# nubi-lab-utils

**EN:** Modern TypeScript utilities for Nubi Lab services: an isomorphic **HttpClient**, structured logging/profiling helpers, and ready-to-use modules (`DateUtils`, `StringUtils`, `StorageUtils`, etc.).  
**ES:** Colección moderna de utilidades TypeScript para los servicios de Nubi Lab: **HttpClient** isomórfico, logging/profiling estructurado y helpers listos (`DateUtils`, `StringUtils`, `StorageUtils`, etc.).

---

## Overview / Resumen

**EN:** Ship consistent networking, logging, and helper APIs across Node.js and browsers with zero setup—everything is published as ESM plus typings.  
**ES:** Centralizá networking, logging y helpers tanto en Node.js como en navegadores sin configuración extra: todo se publica en ESM con definiciones de tipos.

## Highlights / Características

- ✅ **EN:** Fully ESM with `.d.ts` definitions. **ES:** Build 100 % ESM con tipos listos.
- 🌐 **EN:** Works on Node.js 18+ and modern browsers (via `cross-fetch`). **ES:** Compatible con Node.js 18+ y navegadores modernos (usa `cross-fetch`).
- 🔁 **EN:** HttpClient with retries, localized errors, flexible options. **ES:** HttpClient con reintentos, errores localizados y configuración flexible.
- 🧩 **EN:** Helper modules (strings, dates, validators, env, storage). **ES:** Helpers para strings, fechas, validadores, env y storage.
- 🪵 **EN:** Structured logging/profiling: `createLogger`, `Profiler`, `withTiming`. **ES:** Logging/profiling estructurado: `createLogger`, `Profiler`, `withTiming`.

## Installation / Instalación

```bash
npm install nubi-lab-utils
# or / o
pnpm add nubi-lab-utils
```

## Quick Start / Inicio rápido

```ts
import {
  HttpClient,
  createLogger,
  DateUtils,
  StringUtils
} from 'nubi-lab-utils';

const http = new HttpClient({
  baseUrl: 'https://api.my-service.com',
  defaultHeaders: { 'X-Team': 'nubi-lab' },
  locale: 'es',
  errorMessages: {
    es: { 418: 'Soy una tetera ☕' }
  }
});

const users = await http.get<{ id: string; name: string }[]>('/users');

const logger = createLogger({ namespace: 'users-service', level: 'info' });
logger.info('Users synced', { count: users.length });

logger.debug('Next sync ETA (days)', {
  etaDays: DateUtils.diffInDays(new Date(), DateUtils.add(new Date(), { days: 7 }))
});

const slug = StringUtils.slugify('New Users – October 2024');
```

**EN:** Import everything from the root entry, configure the HttpClient once, reuse helpers everywhere.  
**ES:** Importá desde la raíz, configurá el HttpClient una sola vez y reutilizá los helpers en todos tus servicios.

## HttpClient Details / Detalles del HttpClient

- `baseUrl`: **EN** required prefix for relative endpoints. **ES** prefijo requerido para endpoints relativos.
- `defaultHeaders`: **EN** shared headers merged per request. **ES** cabeceras comunes que se combinan en cada request.
- `locale` + `errorMessages`: **EN** localized HTTP errors. **ES** mensajes localizados por código HTTP.
- `fetchImpl`: **EN** inject your own fetch (tests, custom environments). **ES** inyectá tu propio `fetch` (tests o entornos custom).

Each `request` (and `get`, `post`, `put`, `patch`, `delete`) accepts / Cada request acepta:

- `searchParams`: **EN** serializes to URLSearchParams. **ES** se serializa automáticamente.
- `body`: **EN** strings, serializable objects, or `FormData`. **ES** strings, objetos serializables o `FormData`.
- `errorLocale`: **EN** override language per request. **ES** forzá un idioma específico.
- Native `RequestInit` fields (`headers`, `signal`, etc.).

```ts
import { HttpError } from 'nubi-lab-utils';

try {
  await http.get('/users');
} catch (error) {
  if (error instanceof HttpError) {
    console.error('Server error', error.status, error.body);
  }
}
```

## Logging, Profiling & Helpers / Logging, profiling y helpers

```ts
import {
  createLogger,
  withTiming,
  createStopwatch,
  StorageUtils,
  EnvManager
} from 'nubi-lab-utils';

const logger = createLogger({ namespace: 'payments', level: 'debug' });

await withTiming('settlements', async () => {
  const stopwatch = createStopwatch({ label: 'batch-download', logger });
  const batch = await downloadPayments();
  stopwatch.log({ records: batch.length });
});

StorageUtils.safeSetItem('token', 'abc123');
const apiKey = EnvManager.get('API_KEY', { required: true });
```

- `DateUtils`: **EN** safe parsing, add/subtract, configurable diffs, `isSameDay`. **ES** parseo seguro, sumas/restas, diferencias configurables e `isSameDay`.
- `StringUtils`: **EN** slugify, capitalize, masking, interpolation, query strings. **ES** slugify, capitalización, máscaras, interpolación, query strings.
- `Validator`: **EN** lightweight synchronous validators. **ES** validadores sincrónicos livianos.
- `StorageUtils`: **EN** safe wrappers for `localStorage`/`sessionStorage`. **ES** adaptadores seguros para storage del navegador.

## Scripts & Workflow / Scripts y flujo

- `npm run lint`: **EN** TypeScript in no-emit mode. **ES** análisis de tipos sin emitir.
- `npm run build`: **EN** emit JS + types to `dist/`. **ES** compila y genera tipos en `dist/`.
- `npm run clean`: **EN** delete `dist/`. **ES** elimina la carpeta `dist/`.
- `npm run prepare`: **EN** auto-build after install. **ES** compila automáticamente después de instalar dependencias.
- `npm run prepublishOnly`: **EN** lint + clean + build before publishing. **ES** lint + clean + build automático antes de publicar.

## Publish to npm / Publicación en npm

1. `npm login` — **EN** sign in to the registry. **ES** iniciá sesión en el registro.
2. `npm version patch|minor|major` — **EN** bump SemVer. **ES** actualizá la versión según SemVer.
3. `git push --follow-tags` — **EN** push commits + tags. **ES** enviá commits y tags.
4. `npm run lint && npm run build` — **EN** optional preflight. **ES** validación opcional previa.
5. `npm publish --access public` — **EN** publish the tarball. **ES** publicá el paquete.

`prepublishOnly` runs automatically to guarantee a clean build / se ejecuta automáticamente para asegurar un build limpio.

## Compatibility / Compatibilidad

- Node.js >= 18 (ESM, `fetch`, `AbortController`, `URL`).  
- Modern browsers (ships optional `cross-fetch` polyfill).

## License / Licencia

MIT © Nubi Lab
