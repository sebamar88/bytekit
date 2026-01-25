# Bytekit - AI Context Document

> Este documento proporciona contexto completo del proyecto para modelos de IA/LLM.

## 📋 Project Overview

| Attribute | Value |
|-----------|-------|
| **Name** | `bytekit` (formerly `@sebamar88/utils`) |
| **Author** | Sebastián Martinez |
| **License** | MIT |
| **Type** | TypeScript utilities library |
| **Module System** | ESM only (`"type": "module"`) |
| **Node Version** | >=18 |
| **Package Manager** | pnpm (preferred), npm, yarn compatible |

## 🎯 Purpose

Librería de utilidades TypeScript modernas para desarrollo web/node, que incluye:
- **ApiClient isomórfico** con reintentos, errores localizados y circuit breaker
- **Logging estructurado** con namespaces y transports
- **Helpers de uso común** (fechas, strings, arrays, objetos, validación)
- **Utilidades avanzadas** (caché, rate limiting, WebSockets, polling)

## 📁 Project Structure

```
bytekit/
├── src/                      # Source code (TypeScript)
│   ├── index.ts              # Main entry point
│   ├── utils/
│   │   ├── core/             # Core modules (12 files)
│   │   │   ├── ApiClient.ts
│   │   │   ├── Logger.ts
│   │   │   ├── RetryPolicy.ts
│   │   │   ├── ResponseValidator.ts
│   │   │   ├── RequestCache.ts
│   │   │   ├── RateLimiter.ts
│   │   │   ├── RequestDeduplicator.ts
│   │   │   ├── ErrorBoundary.ts
│   │   │   ├── BatchRequest.ts
│   │   │   ├── Profiler.ts
│   │   │   ├── debug.ts
│   │   │   └── index.ts
│   │   ├── helpers/          # Helper utilities (22 files)
│   │   │   ├── DateUtils.ts
│   │   │   ├── StringUtils.ts
│   │   │   ├── ArrayUtils.ts
│   │   │   ├── ObjectUtils.ts
│   │   │   ├── Validator.ts
│   │   │   ├── FormUtils.ts
│   │   │   ├── CryptoUtils.ts
│   │   │   ├── CacheManager.ts
│   │   │   ├── EventEmitter.ts
│   │   │   ├── TimeUtils.ts
│   │   │   ├── UrlBuilder.ts
│   │   │   ├── HttpStatusHelper.ts
│   │   │   ├── PaginationHelper.ts
│   │   │   ├── PollingHelper.ts
│   │   │   ├── DiffUtils.ts
│   │   │   ├── CompressionUtils.ts
│   │   │   ├── WebSocketHelper.ts
│   │   │   ├── StreamingHelper.ts
│   │   │   ├── FileUploadHelper.ts
│   │   │   ├── EnvManager.ts
│   │   │   ├── StorageUtils.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── cli/                  # CLI tool
│       └── index.ts
├── tests/                    # Test files (20 test files)
├── dist/                     # Compiled output (generated)
├── bin/                      # CLI entry point
├── examples/                 # Usage examples
├── docs/                     # Additional documentation
├── wiki-pages/               # GitHub Wiki pages
└── .github/workflows/        # CI/CD configuration
```

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Run tests (includes lint + build)
pnpm run test

# Test with coverage
pnpm run test:coverage

# Lint
pnpm run lint
pnpm run lint:fix

# Format code
pnpm run format

# Clean dist folder
pnpm run clean

# Generate wiki pages
pnpm run wiki:generate
```

## 🧪 Testing

- **Test Runner**: Node.js built-in test runner (`node --test`)
- **Test Location**: `tests/*.test.js`
- **Coverage**: `--experimental-test-coverage` flag
- **Property Testing**: Uses `fast-check` library

### Test Files

| Test File | Module Tested |
|-----------|---------------|
| `api-client.test.js` | ApiClient |
| `batch-request.test.js` | BatchRequest |
| `date-utils.test.js` | DateUtils |
| `error-boundary.test.js` | ErrorBoundary |
| `form-utils.test.js` | FormUtils |
| `http-status-helper.test.js` | HttpStatusHelper |
| `new-utils.test.js` | Multiple utilities |
| `object-utils.test.js` | ObjectUtils |
| `rate-limiter.test.js` | RateLimiter |
| `request-cache.test.js` | RequestCache |
| `request-deduplicator.test.js` | RequestDeduplicator |
| `response-validator.test.js` | ResponseValidator |
| `retry-policy.test.js` | RetryPolicy |
| `storage-manager.test.js` | StorageUtils |
| `string-utils.test.js` | StringUtils |
| `url-builder.test.js` | UrlBuilder |
| `validator.test.js` | Validator |
| `env-manager.test.js` | EnvManager |
| `cli.test.js` | CLI |

## 📦 Module Exports

The package supports both namespace import and tree-shakeable modular imports:

```typescript
// Full import
import { ApiClient, Logger, DateUtils } from "bytekit";

// Modular imports (better tree-shaking)
import { ApiClient } from "bytekit/api-client";
import { DateUtils } from "bytekit/date-utils";
import { StringUtils } from "bytekit/string-utils";
```

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript configuration (strict mode, ES2023 target) |
| `eslint.config.js` | ESLint flat config |
| `.prettierrc` | Prettier formatting config |
| `.npmrc` | NPM registry configuration |
| `.github/workflows/ci.yml` | GitHub Actions CI pipeline |

## 🔄 CI/CD Pipeline

GitHub Actions workflow runs on push/PR to `main`/`master`:

1. **Matrix Build**: Node.js 18.x, 20.x, 22.x on Ubuntu
2. **Steps**: Install → Lint → Build → Test
3. **Coverage Job**: Runs after build, uploads to Codecov

## 🌐 Isomorphic Design

All modules are designed to work in both Node.js and browser environments:
- Uses `cross-fetch` for HTTP requests
- No Node.js-specific APIs in core modules
- Browser-compatible storage and crypto utilities

## 📝 Code Style

- **TypeScript Strict Mode**: All strict checks enabled
- **ESM Only**: No CommonJS support
- **Naming Conventions**:
  - Classes: PascalCase (`ApiClient`, `DateUtils`)
  - Files: PascalCase for classes (`ApiClient.ts`)
  - Functions: camelCase
  - Constants: SCREAMING_SNAKE_CASE
- **Comments**: Preserved in build (`removeComments: false`)

## 🔗 Related Resources

- **GitHub Repo**: https://github.com/sebamar88/bytekit
- **NPM Package**: https://www.npmjs.com/package/bytekit
- **Wiki**: https://github.com/sebamar88/bytekit/wiki
