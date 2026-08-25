[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / SchemaAdapter

# Interface: SchemaAdapter\<T\>

Defined in: core/SchemaAdapter.ts:4

Generic interface for schema validation adapters (e.g., Zod, Valibot, ArkType)

## Type Parameters

### T

`T` = `unknown`

## Properties

### parse()

> **parse**: (`data`) => `T`

Defined in: core/SchemaAdapter.ts:9

Parses and validates the data. Should throw an error if validation fails.
Returns the validated (and potentially transformed) data.

#### Parameters

##### data

`unknown`

#### Returns

`T`
