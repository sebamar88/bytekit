[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / valibotAdapter

# Function: valibotAdapter()

> **valibotAdapter**\<`T`\>(`schema`, `parseFn`): [`SchemaAdapter`](../interfaces/SchemaAdapter.md)\<`T`\>

Defined in: core/SchemaAdapter.ts:34

Adapter for Valibot schemas.
Wraps Valibot's `parse` function and schema into a SchemaAdapter.

## Type Parameters

### T

`T`

## Parameters

### schema

`unknown`

### parseFn

(`schema`, `data`) => `T`

## Returns

[`SchemaAdapter`](../interfaces/SchemaAdapter.md)\<`T`\>

## Example

```ts
import { object, string } from "valibot";
import { valibotAdapter } from "bytekit";

const schema = object({ name: string() });
const adapter = valibotAdapter(schema, parse);
```
