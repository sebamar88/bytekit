# Error Handling: fetch vs ApiClient

## Problema Original

Con `fetch` nativo, obtienes acceso directo a `response.status` y `response.text()`, pero debes manejar manualmente:

- Retries
- Timeouts
- Error parsing
- Logging

Con `ApiClient`, obtienes todo lo anterior automáticamente, pero el error se envuelve en `ApiError`.

## Comparación

### ❌ fetch nativo - Error handling manual

```typescript
try {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", ... }),
  });

  console.log("Status:", response.status);  // ✅ Acceso directo

  if (!response.ok) {
    const text = await response.text();      // ✅ Puedes ver el error crudo
    console.log("Error:", text);
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();

} catch (error) {
  console.error(error.message);  // ❌ Solo mensaje genérico
  // NO tienes: status, body estructurado, retries automáticos
}
```

**Problemas:**

- Sin retries automáticos
- Sin timeout configurado
- Debes parsear errores manualmente
- Logging manual
- Repetir este código en cada request

---

### ✅ ApiClient - Error handling automático + acceso completo

```typescript
import { ApiClient, ApiError } from "bytekit";

const client = new ApiClient({
  baseUrl: "https://api.groq.com/openai/v1",
  defaultHeaders: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  retryPolicy: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
  },
  timeout: 30000,
});

try {
  const data = await client.post("/chat/completions", {
    model: "llama-3.3-70b-versatile",
    ...
  });

  // ✅ Data ya parseado, retries automáticos

} catch (error) {
  if (error instanceof ApiError) {
    // ✅ TODA la información disponible
    console.log("Status:", error.status);           // 400, 401, 500, etc.
    console.log("Status Text:", error.statusText);  // "Bad Request"
    console.log("Message:", error.message);         // Localizado
    console.log("Body:", error.body);               // Response completo

    // Para debugging detallado:
    console.log(error.toString());
    // ApiError: La solicitud es inválida
    // Status: 400 Bad Request
    // Body: {
    //   "error": {
    //     "message": "Invalid model",
    //     "type": "invalid_request_error"
    //   }
    // }
  }
}
```

**Ventajas:**

- ✅ Retries automáticos (configurable)
- ✅ Timeout configurado
- ✅ Errores ya parseados en `error.body`
- ✅ Acceso a TODOS los detalles: status, statusText, body
- ✅ Logging automático (si configuras logger)
- ✅ Code centralizado

---

## Solución: Mejoras a ApiError

### Antes (v1.x)

```typescript
catch (error) {
  console.log(error.message);  // ❌ Solo mensaje genérico
  console.log(error.status);   // ❌ undefined
  console.log(error.body);     // ❌ undefined
}
```

### Ahora (v2.x) ✅

```typescript
catch (error) {
  if (error instanceof ApiError) {
    console.log(error.message);     // ✅ Mensaje localizado
    console.log(error.status);      // ✅ 400
    console.log(error.statusText);  // ✅ "Bad Request"
    console.log(error.body);        // ✅ Full response object
    console.log(error.details);     // ✅ Todo junto
    console.log(error.toString());  // ✅ Formato legible
  }
}
```

---

## Casos de Uso Reales

### 1. Debugging durante desarrollo

```typescript
try {
    await client.post("/endpoint", data);
} catch (error) {
    if (error instanceof ApiError) {
        // Durante desarrollo, muestra TODO
        console.error(error.toString());
        /*
    ApiError: La solicitud es inválida
    Status: 400 Bad Request
    Body: {
      "error": "Invalid model name",
      "valid_models": ["llama-3.3-70b-versatile", ...]
    }
    */
    }
}
```

### 2. Error handling específico por API

```typescript
try {
  await groqClient.post("/chat/completions", { ... });
} catch (error) {
  if (error instanceof ApiError) {
    // Groq devuelve errores estructurados
    const groqError = error.body as {
      error?: {
        message: string;
        type: string;
        code?: string;
      }
    };

    if (groqError?.error?.type === "rate_limit_exceeded") {
      console.log("Rate limited! Wait before retry");
      console.log("Details:", groqError.error.message);
    }
  }
}
```

### 3. Logging para producción

```typescript
try {
    await client.post("/endpoint", data);
} catch (error) {
    if (error instanceof ApiError) {
        // Log estructurado para monitoring
        logger.error("API request failed", {
            status: error.status,
            statusText: error.statusText,
            endpoint: "/endpoint",
            errorBody: error.body,
            timestamp: new Date().toISOString(),
        });

        // O serializa todo el error
        logger.error("API request failed", JSON.parse(JSON.stringify(error)));
    }
}
```

### 4. Retry selectivo

```typescript
try {
    await client.post("/endpoint", data, {
        skipRetry: true, // No retry para este request específico
    });
} catch (error) {
    if (error instanceof ApiError) {
        // Decide si hacer retry manual basado en el error
        if (error.status === 429 || error.status >= 500) {
            console.log("Retriable error, waiting...");
            await sleep(5000);
            // Manual retry
        }
    }
}
```

---

## Recomendación Final

**Usa ApiClient cuando:**

- ✅ Necesitas retries automáticos
- ✅ Quieres timeout configurado
- ✅ Prefieres errores estructurados y localizados
- ✅ Necesitas logging centralizado
- ✅ Trabajas con múltiples endpoints similares

**Usa fetch nativo cuando:**

- ⚠️ Necesitas control total del bajo nivel
- ⚠️ Request muy específico one-off
- ⚠️ Debugging de issues muy particulares de la librería fetch

**En general, ApiClient cubre el 95% de casos y ahora con `error.body`, `error.details`, y `error.toString()` tienes acceso a TODA la información para debugging.**
