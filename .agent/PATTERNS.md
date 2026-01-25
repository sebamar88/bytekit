# Bytekit Coding Patterns

> Patrones de código y convenciones utilizadas en el proyecto.

## 📐 Design Patterns

### 1. Options Pattern

Todos los módulos usan un objeto de opciones con valores por defecto:

```typescript
interface ModuleOptions {
  requiredOption: string;
  optionalOption?: number;
}

const DEFAULT_OPTIONS: Partial<ModuleOptions> = {
  optionalOption: 10
};

class Module {
  private options: Required<ModuleOptions>;

  constructor(options: ModuleOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as Required<ModuleOptions>;
  }
}
```

### 2. Static Utility Class Pattern

Para helpers sin estado:

```typescript
export class StringUtils {
  // Private constructor prevents instantiation
  private constructor() {}

  static slugify(input: string): string {
    return input
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  static capitalize(input: string): string {
    return input.charAt(0).toUpperCase() + input.slice(1);
  }
}
```

### 3. Factory Function Pattern

Para crear instancias configuradas:

```typescript
export function createApiClient(options: ApiClientOptions): ApiClient {
  return new ApiClient(options);
}

export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}
```

### 4. Builder Pattern

Para construcción fluida:

```typescript
class UrlBuilder {
  private url: URL;

  constructor(base: string) {
    this.url = new URL(base);
  }

  path(...segments: string[]): this {
    this.url.pathname = segments.join('/');
    return this;
  }

  query(params: Record<string, string>): this {
    Object.entries(params).forEach(([k, v]) => {
      this.url.searchParams.set(k, v);
    });
    return this;
  }

  toString(): string {
    return this.url.toString();
  }
}
```

## 🎨 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `ApiClient`, `DateUtils` |
| Interfaces | PascalCase, descriptive | `ApiClientOptions`, `LoggerConfig` |
| Functions | camelCase, verb prefix | `createLogger`, `parseDate` |
| Constants | SCREAMING_SNAKE_CASE | `DEFAULT_TIMEOUT_MS` |
| Private members | underscore prefix or `#` | `_cache`, `#privateField` |
| Files (classes) | PascalCase.ts | `ApiClient.ts` |
| Files (utils) | kebab-case.ts | `date-utils.ts` |
| Test files | kebab-case.test.js | `api-client.test.js` |

## 🔐 TypeScript Patterns

### Generic Responses

```typescript
async function get<T>(path: string): Promise<T> {
  const response = await fetch(path);
  return response.json() as T;
}

// Usage
const users = await client.get<User[]>('/users');
```

### Discriminated Unions

```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };

function processResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data); // TypeScript knows data exists
  } else {
    console.error(result.error); // TypeScript knows error exists
  }
}
```

### Type Guards

```typescript
function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}
```

## 🌍 Isomorphic Patterns

### Environment Detection

```typescript
const isBrowser = typeof window !== 'undefined';
const isNode = typeof process !== 'undefined' && Boolean(process.versions?.node);

// Conditional implementation
const storage = isBrowser 
  ? window.localStorage 
  : createNodeStorage();
```

### Polyfill Pattern

```typescript
// Use cross-fetch for isomorphic fetch
import fetch from 'cross-fetch';

// Fallback pattern
const crypto = globalThis.crypto ?? await import('crypto').then(m => m.webcrypto);
```

## 🧪 Testing Patterns

### Node.js Test Runner

```javascript
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';

describe('ModuleName', () => {
  let instance;

  beforeEach(() => {
    instance = new Module();
  });

  afterEach(() => {
    instance = null;
  });

  describe('methodName', () => {
    it('should do expected behavior', () => {
      const result = instance.method('input');
      assert.strictEqual(result, 'expected');
    });

    it('should throw on invalid input', () => {
      assert.throws(
        () => instance.method(null),
        { message: /invalid/i }
      );
    });
  });
});
```

### Property-Based Testing

```javascript
import fc from 'fast-check';

it('should handle any valid string', () => {
  fc.assert(
    fc.property(fc.string(), (s) => {
      const result = StringUtils.slugify(s);
      // Property: result should contain no uppercase
      return result === result.toLowerCase();
    })
  );
});
```

### Async Testing

```javascript
it('should resolve with data', async () => {
  const result = await client.get('/endpoint');
  assert.ok(result);
});

it('should reject on error', async () => {
  await assert.rejects(
    async () => client.get('/invalid'),
    { name: 'ApiError' }
  );
});
```

## 📝 Documentation Patterns

### JSDoc Comments

```typescript
/**
 * Creates a slugified version of the input string.
 * 
 * @param input - The string to slugify
 * @param options - Optional configuration
 * @returns The slugified string, lowercase with hyphens
 * @throws {TypeError} If input is not a string
 * 
 * @example
 * ```ts
 * StringUtils.slugify('Hello World!'); // 'hello-world'
 * StringUtils.slugify('Café Müller', { locale: 'en' }); // 'cafe-muller'
 * ```
 */
static slugify(input: string, options?: SlugifyOptions): string {
  // Implementation
}
```

## ⚠️ Error Handling

### Custom Error Classes

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace?.(this, ApiError);
  }
}
```

### Error Wrapping

```typescript
try {
  await riskyOperation();
} catch (error) {
  throw new ApiError(
    'Operation failed',
    500,
    'OPERATION_FAILED',
    { originalError: error }
  );
}
```
