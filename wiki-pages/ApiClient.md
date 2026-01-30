# ApiClient

> **Categoría:** Core | **[⬅️ Volver al índice](Home)**

#### ApiClient

```ts
class ApiClient {
    get<T>(url: string, options?: RequestOptions): Promise<T>;
    post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
    put<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
    patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T>;
    delete<T>(url: string, options?: RequestOptions): Promise<T>;
    getList<T>(
        url: string,
        options?: GetListOptions
    ): Promise<PaginatedResponse<T>>;
    request<T>(
        method: string,
        url: string,
        options?: RequestOptions
    ): Promise<T>;
}

function createApiClient(config: ApiClientConfig): ApiClient;
class HttpError extends Error {
    status: number;
    body: unknown;
}
```

---

## Enlaces Relacionados

- **[📚 Documentación Principal](https://github.com/sebamar88/bytekit#readme)**
- **[🏠 Índice de Wiki](Home)**
- **[📦 Módulos Core](Core)**

## Instalación

```bash
npm install bytekit
```

## Importación

```typescript
// Importación específica (recomendado)
import { ApiClient } from "bytekit/apiclient";

// Importación desde el índice principal
import { ApiClient } from "bytekit";
```

---

## Error Handling / Manejo de Errores

### ApiError Class

All HTTP errors are wrapped in an `ApiError` instance with full response details:

```typescript
class ApiError extends Error {
    readonly status: number; // HTTP status code
    readonly statusText: string; // HTTP status text
    readonly body?: unknown; // Full response body
    readonly isTimeout: boolean; // True if request timed out

    get details(): object; // Complete error info
    toString(): string; // Human-readable format
    toJSON(): object; // JSON serialization
}
```

### Accessing Error Information

```typescript
import { ApiClient, ApiError } from "bytekit";

const client = new ApiClient({
    baseUrl: "https://api.example.com",
});

try {
    const data = await client.post("/endpoint", { foo: "bar" });
} catch (error) {
    if (error instanceof ApiError) {
        // Direct property access
        console.log("Status:", error.status); // e.g., 400
        console.log("Status Text:", error.statusText); // e.g., "Bad Request"
        console.log("Message:", error.message); // Localized message

        // Full API response body
        console.log("Response Body:", error.body);
        // { "error": "Invalid parameter", "details": [...] }

        // Complete error details
        console.log("Details:", error.details);
        // { status: 400, statusText: "Bad Request", message: "...", body: {...} }

        // Human-readable format
        console.log(error.toString());
        // ApiError: La solicitud es inválida
        // Status: 400 Bad Request
        // Body: { "error": "..." }

        // JSON serialization for logging
        console.log(JSON.stringify(error));
        // {"status":400,"statusText":"Bad Request","message":"...","body":{...}}
    }
}
```

### Debugging Tips

1. **Use `error.body`** - Contains the full API response (errors, validation details, etc.)
2. **Use `error.details`** - Complete error object for logging
3. **Use `error.toString()`** - Formatted multi-line output for console
4. **All properties are public** - Direct access to `status`, `statusText`, `body`, `isTimeout`

### Common Error Patterns

```typescript
// Check specific status codes
if (error instanceof ApiError) {
    switch (error.status) {
        case 401:
            // Redirect to login
            break;
        case 404:
            // Show not found message
            break;
        case 429:
            // Handle rate limiting
            console.log("Rate limited, retry after:", error.body?.retryAfter);
            break;
        default:
            // Generic error handling
            console.error(error.toString());
    }
}

// Check for timeout
if (error instanceof ApiError && error.isTimeout) {
    console.log("Request timed out, please try again");
}

// Extract API-specific error details
if (error instanceof ApiError && error.body) {
    const apiError = error.body as { code?: string; details?: string[] };
    console.log("Error code:", apiError.code);
    console.log("Details:", apiError.details?.join(", "));
}
```

---
