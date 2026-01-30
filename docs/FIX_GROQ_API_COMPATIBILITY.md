# Fix para compatibilidad de bytekit con APIs externas (Groq, OpenAI, etc.)

## Problema

Bytekit estaba generando errores 401 (Unauthorized) al intentar conectarse a APIs externas como Groq API, a pesar de tener credenciales válidas. El error ocurría porque:

1. **Los headers se pasaban como objeto `Headers`** en lugar de un objeto plano, lo cual no es compatible con todas las implementaciones de fetch (especialmente `cross-fetch` y `node-fetch`).

2. **El header `Content-Type` se sobrescribía automáticamente**, incluso si el usuario ya lo había especificado en `defaultHeaders` o en los headers de la petición.

## Solución

Se realizaron los siguientes cambios en [src/utils/core/ApiClient.ts](src/utils/core/ApiClient.ts):

### 1. Conversión de Headers a objeto plano

**Antes:**

```typescript
let init: RequestInit = {
    ...rest,
    headers, // Objeto Headers
    body: preparedBody,
    signal,
};
```

**Después:**

```typescript
// Convertir Headers a objeto plano para compatibilidad
const headersObject: Record<string, string> = {};
headers.forEach((value, key) => {
    headersObject[key] = value;
});

let init: RequestInit = {
    ...rest,
    headers: headersObject, // Objeto plano
    body: preparedBody,
    signal,
};
```

### 2. Respeto del Content-Type existente

**Antes:**

```typescript
if (preparedBody && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
}
```

**Después:**

```typescript
// Solo setear Content-Type si no existe ya y hay body
if (
    preparedBody &&
    !(body instanceof FormData) &&
    !headers.has("Content-Type")
) {
    headers.set("Content-Type", "application/json");
}
```

### 3. Mejor logging de headers

**Antes:**

```typescript
this.logger?.debug("HTTP Request", {
    method: rest.method,
    url,
    body,
});
```

**Después:**

```typescript
this.logger?.debug("HTTP Request", {
    method: rest.method,
    url,
    headers: headersObject,
    body,
});
```

## Beneficios

✅ **Compatibilidad completa** con todas las implementaciones de fetch:

- Fetch nativo de Node.js
- cross-fetch
- node-fetch
- Fetch del navegador

✅ **Respeta headers personalizados**: No sobrescribe `Content-Type` si ya está definido

✅ **Funciona con Groq API, OpenAI y otras APIs externas**: Los headers de autenticación se preservan correctamente

✅ **Mejor debugging**: Ahora se pueden ver los headers en los logs

## Tests

Se crearon tests específicos en [tests/api-client-headers.test.js](tests/api-client-headers.test.js) que verifican:

- ✅ Los headers se convierten a objeto plano antes de pasarlos a fetch
- ✅ El header `Authorization` se preserva en peticiones POST
- ✅ El `Content-Type` no se sobrescribe si ya está definido
- ✅ El `Content-Type` se establece automáticamente solo cuando es necesario
- ✅ Los headers de petición se fusionan correctamente con los headers por defecto
- ✅ Se pueden sobrescribir headers por defecto en peticiones específicas

## Próximos pasos

1. Ejecutar todos los tests para asegurar que no se rompió nada:

    ```bash
    pnpm test
    ```

2. Actualizar la versión en `package.json` (sugerido: 1.0.3 o 0.2.5)

3. Publicar nueva versión:

    ```bash
    pnpm build
    npm publish
    ```

4. Actualizar proyectos que dependen de bytekit:
    ```bash
    npm update bytekit
    # o
    pnpm update bytekit
    ```

## Ejemplo de uso con Groq API

```typescript
import { ApiClient } from "bytekit";

const client = new ApiClient({
    baseURL: "https://api.groq.com/openai/v1",
    defaultHeaders: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
    },
});

const response = await client.post("/chat/completions", {
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: "Hello!" }],
});

console.log(response.choices[0].message.content);
```

## Referencias

- Issue original: Error 401 con Groq API a pesar de credenciales válidas
- Fetch directo funcionaba, pero bytekit fallaba
- Problema identificado: Headers no se serializaban correctamente
