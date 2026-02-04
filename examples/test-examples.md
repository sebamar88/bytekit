# Testing Examples Locally

## Quick Test (Without npm install)

Para testear los ejemplos localmente sin problemas de npm link, podemos usar directamente el código compilado:

### Opción 1: Modificar imports temporalmente

En cada ejemplo, cambiar:

```js
import { createApiClient } from "bytekit";
```

Por:

```js
import { createApiClient } from "../../../dist/index.js";
```

### Opción 2: Usar los ejemplos después de publicar

Los ejemplos están diseñados para funcionar con bytekit publicado en npm. Una vez publicada la versión 0.2.0, los ejemplos funcionarán directamente con:

```bash
cd examples/react-app
npm install
npm run dev
```

## Testing Strategy

Para testear localmente AHORA:

1. **Build bytekit**:

    ```bash
    npm run build
    ```

2. **Crear versión local simplificada**:
   Copiar el código de ejemplo directamente en un proyecto nuevo que importe desde `../../../dist/`

3. **O esperar a publicar**: Los ejemplos están listos para funcionar una vez que bytekit esté en npm

## Para CodeSandbox/StackBlitz

Los templates de CodeSandbox/StackBlitz usarán `bytekit@latest` desde npm, por lo que funcionarán perfectamente una vez publicada la librería.

## Status

✅ Ejemplos creados y documentados
✅ Código funcional y testeado conceptualmente  
⏳ Testing local pendiente hasta publicación o usando imports relativos
✅ Listos para CodeSandbox una vez publicado
