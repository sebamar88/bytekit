[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / captureDebug

# Function: captureDebug()

> **captureDebug**\<`T`\>(`fn`): `Promise`\<\{ `result`: `T`; `durationMs`: `number`; \}\>

Defined in: core/debug.ts:132

Captura una función sin logger, útil para medir internamente y devolver datos crudos.

## Type Parameters

### T

`T`

## Parameters

### fn

() => `T` \| `Promise`\<`T`\>

## Returns

`Promise`\<\{ `result`: `T`; `durationMs`: `number`; \}\>
