# ApiClient Improvements - v2.0.0

## 🐛 Bug Fix: POST/PUT/PATCH Body Handling

### Problema Identificado

Cuando se usaba `ApiClient.post()` de forma intuitiva (como axios o fetch):

```typescript
await client.post("/api/users", { name: "John" });
```

El objeto **NO** se enviaba como body, porque la firma esperaba `RequestOptions` donde el body va en `options.body`.

**Resultado**: El request se enviaba sin body o con body vacío, causando errores 400 en APIs externas (como Groq, OpenAI, etc.)

---

## ✅ Solución Implementada

Ahora `post()`, `put()` y `patch()` soportan **2 formas**:

### 1. Body directo (nuevo - como axios/fetch)

```typescript
const client = new ApiClient({ baseUrl: "https://api.example.com" });

// ✅ Ahora funciona intuitivamente
await client.post("/users", {
    name: "John Doe",
    email: "john@example.com",
});

await client.put("/users/123", {
    name: "Jane Doe",
});

await client.patch("/users/123", {
    status: "active",
});
```

### 2. RequestOptions (backward compatible)

```typescript
// ✅ Sigue funcionando para casos avanzados
await client.post("/users", {
    body: { name: "John" },
    headers: { "X-Custom": "value" },
    searchParams: { version: "v2" },
    timeoutMs: 5000,
});
```

---

## 🔍 Detección Automática

El ApiClient detecta automáticamente si le pasaste:

- **Body directo**: Cualquier objeto plano, array, primitivo
- **RequestOptions**: Objeto con keys como `searchParams`, `headers`, `timeoutMs`, etc.

```typescript
// Detectado como body directo
await client.post("/post", { name: "John", age: 30 });

// Detectado como RequestOptions (tiene 'searchParams')
await client.post("/post", {
    body: { name: "John" },
    searchParams: { v: "2" },
});

// Edge case: objeto con campo 'body' como dato
await client.post("/messages", {
    body: "This is the message content", // ✅ Tratado como dato
    title: "Important",
});
```

---

## 🧪 Tests de Compatibilidad

Se crearon tests exhaustivos en:

- `tests/api-client-body-detection.test.js`
- `scripts/test-improved-post.ts`
- `scripts/test-post-signature.ts`

Cubre:

- ✅ Body directo (objetos, arrays, primitivos)
- ✅ RequestOptions con todas las combinaciones
- ✅ Edge cases (objetos con campo 'body', etc.)
- ✅ Backward compatibility

---

## 📊 Comparación Antes/Después

### ❌ ANTES (v1.x)

```typescript
// NO funcionaba ❌
await client.post("/chat/completions", {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "hello" }],
});
// Body enviado: vacío o undefined
// Error: 400 Bad Request

// Tenías que hacer ✅ (poco intuitivo)
await client.post("/chat/completions", {
    body: {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "hello" }],
    },
});
```

### ✅ AHORA (v2.x)

```typescript
// ✅ Funciona de ambas formas
await client.post("/chat/completions", {
  model: "llama-3.3-70b-versatile",
  messages: [{ role: "user", content: "hello" }]
});

// ✅ O la forma avanzada si necesitas options
await client.post("/chat/completions", {
  body: { model: "...", messages: [...] },
  timeoutMs: 30000,
  skipRetry: false,
});
```

---

## 🔧 Cambios Técnicos

### Nuevos métodos privados en `ApiClient`:

```typescript
private normalizeBodyOrOptions(bodyOrOptions?: RequestOptions | unknown): RequestOptions
private isRequestOptions(obj: unknown): obj is RequestOptions
```

### Firmas actualizadas:

```typescript
// Antes
async post<T>(path: string, options?: RequestOptions): Promise<T>

// Ahora
async post<T>(path: string, bodyOrOptions?: RequestOptions | unknown): Promise<T>
```

Lo mismo para `put()` y `patch()`.

---

## 🎯 Casos de Uso Reales

### OpenAI/Groq API

```typescript
const groqClient = new ApiClient({
    baseUrl: "https://api.groq.com/openai/v1",
    defaultHeaders: {
        Authorization: `Bearer ${API_KEY}`,
    },
});

// ✅ Ahora funciona directamente
const response = await groqClient.post("/chat/completions", {
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: "Hello" }],
    temperature: 0.7,
});
```

### REST API típica

```typescript
// Create user
await client.post("/api/users", {
    name: "John",
    email: "john@example.com",
});

// Update user
await client.put("/api/users/123", {
    name: "Jane Doe",
});

// Partial update
await client.patch("/api/users/123", {
    status: "active",
});
```

---

## ⚠️ Breaking Changes

**NINGUNO** - Es 100% backward compatible. El código existente que usa `{ body: data }` sigue funcionando.

---

## 📖 Documentación Actualizada

- ✅ `wiki-pages/ApiClient.md` - Sección de Error Handling
- ✅ `docs/ERROR_HANDLING_COMPARISON.md` - Comparación fetch vs ApiClient
- ✅ Scripts de testing y ejemplos

---

## 🚀 Migración

No requiere cambios en código existente. Opcionalmente puedes simplificar:

```typescript
// Antes (sigue funcionando)
await client.post("/users", { body: userData });

// Ahora (más simple)
await client.post("/users", userData);
```

---

## 🎉 Resultado Final

ApiClient ahora tiene una API más intuitiva, compatible con axios/fetch, mientras mantiene todas sus ventajas:

- ✅ Retries automáticos
- ✅ Circuit breaker
- ✅ Timeout configurable
- ✅ Error handling mejorado con `ApiError`
- ✅ Logging automático
- ✅ **Y ahora con sintaxis intuitiva para POST/PUT/PATCH**
