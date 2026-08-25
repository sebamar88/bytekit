[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / measureAsync

# Function: measureAsync()

> **measureAsync**\<`T`\>(`label`, `fn`, `options`): `Promise`\<\{ `result`: `T`; `durationMs`: `number`; \}\>

Defined in: core/debug.ts:106

Versión asíncrona de withTiming con resultado enriquecido.

## Type Parameters

### T

`T`

## Parameters

### label

`string`

### fn

() => `T` \| `Promise`\<`T`\>

### options

[`StopwatchOptions`](../interfaces/StopwatchOptions.md) = `{}`

## Returns

`Promise`\<\{ `result`: `T`; `durationMs`: `number`; \}\>
