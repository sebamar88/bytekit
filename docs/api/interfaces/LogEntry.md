[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / LogEntry

# Interface: LogEntry\<TContext\>

Defined in: core/Logger.ts:4

## Type Parameters

### TContext

`TContext` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### level

> **level**: [`LogLevel`](../type-aliases/LogLevel.md)

Defined in: core/Logger.ts:7

***

### message

> **message**: `string`

Defined in: core/Logger.ts:8

***

### namespace?

> `optional` **namespace**: `string`

Defined in: core/Logger.ts:9

***

### timestamp

> **timestamp**: `Date`

Defined in: core/Logger.ts:10

***

### context?

> `optional` **context**: `TContext`

Defined in: core/Logger.ts:11

***

### error?

> `optional` **error**: `Error`

Defined in: core/Logger.ts:12
