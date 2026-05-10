[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ErrorBoundaryConfig

# Interface: ErrorBoundaryConfig

Defined in: core/ErrorBoundary.ts:16

## Properties

### logger?

> `optional` **logger**: [`Logger`](../classes/Logger.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: core/ErrorBoundary.ts:17

***

### handlers?

> `optional` **handlers**: [`ErrorHandler`](ErrorHandler.md)[]

Defined in: core/ErrorBoundary.ts:18

***

### onError()?

> `optional` **onError**: (`error`, `context`) => `void`

Defined in: core/ErrorBoundary.ts:19

#### Parameters

##### error

`Error`

##### context

[`ErrorContext`](ErrorContext.md)

#### Returns

`void`

***

### onErrorRecovery()?

> `optional` **onErrorRecovery**: (`error`, `context`) => `void`

Defined in: core/ErrorBoundary.ts:20

#### Parameters

##### error

`Error`

##### context

[`ErrorContext`](ErrorContext.md)

#### Returns

`void`

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: core/ErrorBoundary.ts:21

***

### retryDelay?

> `optional` **retryDelay**: `number`

Defined in: core/ErrorBoundary.ts:22

***

### fallbackUI?

> `optional` **fallbackUI**: `string`

Defined in: core/ErrorBoundary.ts:23

***

### isDevelopment?

> `optional` **isDevelopment**: `boolean`

Defined in: core/ErrorBoundary.ts:24
