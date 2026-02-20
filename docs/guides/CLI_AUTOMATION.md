# CLI Automation Guide

The `bytekit` CLI is designed to speed up the transition from backend specifications to frontend implementation.

## 1. Type Generation from Swagger/OpenAPI

Stop manually writing interfaces. Use `generate-swagger` to keep your frontend types in sync with the backend.

### Command
```bash
npx bytekit swagger https://api.yourservice.com/v3/api-docs -o src/types/api.ts
```

### Why use it?
- **Accuracy**: Reflects the exact schema from the server.
- **Speed**: Generates hundreds of interfaces in milliseconds.
- **Completeness**: Handles Enums, Arrays, Objects, and nested references.

## 2. Generate Types from any JSON Endpoint

If you don't have a Swagger spec, you can still generate types by inspecting a live response.

### Command
```bash
npx bytekit type https://api.example.com/users/1 --name UserProfile
```

This will call the API, inspect the JSON, and generate a `UserProfile` interface including optional fields and proper primitive types.

## 3. Scaffolding New Resources

Create a consistent structure for your API calls and state management hooks.

### Command
```bash
npx bytekit resource product
```

This generates:
- `src/api/product.ts`: API client setup for the resource.
- `src/hooks/useProduct.ts`: State management hooks (compatible with our QueryClient).
- `src/types/product.ts`: Initial type definitions.
