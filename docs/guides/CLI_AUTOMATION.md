# CLI Automation Guide

The `bytekit` CLI is designed to speed up the transition from backend specifications to frontend implementation.

## Security defaults in v3

- Remote fetches require `https://`.
- Plain `http://` is only supported for `localhost` and loopback addresses.
- Generated identifiers are sanitized before being written to disk.

## 1. Type Generation from Swagger/OpenAPI

Stop manually writing interfaces. Use `bytekit --swagger` to keep your frontend types in sync with the backend.

### Command
```bash
npx bytekit --swagger https://api.yourservice.com/v3/api-docs
```

### Why use it?
- **Accuracy**: Reflects the exact schema from the server.
- **Speed**: Generates hundreds of interfaces in milliseconds.
- **Completeness**: Handles Enums, Arrays, Objects, and nested references.

## 2. Generate Types from any JSON Endpoint

If you don't have a Swagger spec, you can still generate types by inspecting a live response.

### Command
```bash
npx bytekit --type https://api.example.com/users/1
```

This will call the API, inspect the JSON, and generate a `UserProfile` interface including optional fields and proper primitive types.

## 3. DDD / Hexagonal Scaffolding

Create a bounded-context skeleton with inbound/outbound ports and optional use cases.

### Command
```bash
npx bytekit --ddd --domain=Product --port=ProductRepository --actions=create,findById,update,delete
```
