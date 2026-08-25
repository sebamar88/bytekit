[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / zodAdapter

# Function: zodAdapter()

> **zodAdapter**\<`T`\>(`schema`): [`SchemaAdapter`](../interfaces/SchemaAdapter.md)\<`T`\>

Defined in: core/SchemaAdapter.ts:17

Adapter for Zod schemas.
Since Zod schemas already have a `parse` method, this just provides type safety,
but you can also pass a Zod schema directly to `validateResponse`.

## Type Parameters

### T

`T`

## Parameters

### schema

#### parse

(`data`) => `T`

## Returns

[`SchemaAdapter`](../interfaces/SchemaAdapter.md)\<`T`\>
