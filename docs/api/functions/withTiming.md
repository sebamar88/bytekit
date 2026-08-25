[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / withTiming

# Function: withTiming()

> **withTiming**\<`T`\>(`label`, `fn`, `options`): `Promise`\<`T`\>

Defined in: core/debug.ts:74

Ejecuta una función (sync o async) midiendo su tiempo total.

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

`Promise`\<`T`\>
