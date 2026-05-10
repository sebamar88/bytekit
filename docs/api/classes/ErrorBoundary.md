[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ErrorBoundary

# Class: ErrorBoundary

Defined in: core/ErrorBoundary.ts:98

Global error boundary for handling and recovering from errors

## Constructors

### Constructor

> **new ErrorBoundary**(`config`): `ErrorBoundary`

Defined in: core/ErrorBoundary.ts:111

#### Parameters

##### config

[`ErrorBoundaryConfig`](../interfaces/ErrorBoundaryConfig.md) = `{}`

#### Returns

`ErrorBoundary`

## Methods

### handle()

> **handle**(`error`, `context`): `Promise`\<`void`\>

Defined in: core/ErrorBoundary.ts:172

Handle an error

#### Parameters

##### error

`Error`

##### context

[`ErrorContext`](../interfaces/ErrorContext.md) = `{}`

#### Returns

`Promise`\<`void`\>

***

### execute()

> **execute**\<`T`\>(`fn`, `context`, `retries`): `Promise`\<`T`\>

Defined in: core/ErrorBoundary.ts:218

Execute function with error handling and retry logic

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `Promise`\<`T`\>

##### context

[`ErrorContext`](../interfaces/ErrorContext.md) = `{}`

##### retries

`number` = `...`

#### Returns

`Promise`\<`T`\>

***

### executeSync()

> **executeSync**\<`T`\>(`fn`, `context`): `T`

Defined in: core/ErrorBoundary.ts:249

Execute function synchronously with error handling

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `T`

##### context

[`ErrorContext`](../interfaces/ErrorContext.md) = `{}`

#### Returns

`T`

***

### wrap()

> **wrap**\<`T`\>(`fn`, `context?`): `T`

Defined in: core/ErrorBoundary.ts:267

Wrap async function with error handling

#### Type Parameters

##### T

`T` *extends* (...`args`) => `Promise`\<`unknown`\>

#### Parameters

##### fn

`T`

##### context?

[`ErrorContext`](../interfaces/ErrorContext.md)

#### Returns

`T`

***

### wrapSync()

> **wrapSync**\<`T`\>(`fn`, `context?`): `T`

Defined in: core/ErrorBoundary.ts:287

Wrap sync function with error handling

#### Type Parameters

##### T

`T` *extends* (...`args`) => `unknown`

#### Parameters

##### fn

`T`

##### context?

[`ErrorContext`](../interfaces/ErrorContext.md)

#### Returns

`T`

***

### addHandler()

> **addHandler**(`handler`): `void`

Defined in: core/ErrorBoundary.ts:314

Register error handler

#### Parameters

##### handler

[`ErrorHandler`](../interfaces/ErrorHandler.md)

#### Returns

`void`

***

### removeHandler()

> **removeHandler**(`handler`): `void`

Defined in: core/ErrorBoundary.ts:321

Remove error handler

#### Parameters

##### handler

[`ErrorHandler`](../interfaces/ErrorHandler.md)

#### Returns

`void`

***

### clearHandlers()

> **clearHandlers**(): `void`

Defined in: core/ErrorBoundary.ts:331

Clear all handlers

#### Returns

`void`

***

### getErrorHistory()

> **getErrorHistory**(`limit`): `object`[]

Defined in: core/ErrorBoundary.ts:338

Get error history

#### Parameters

##### limit

`number` = `10`

#### Returns

`object`[]

***

### clearErrorHistory()

> **clearErrorHistory**(): `void`

Defined in: core/ErrorBoundary.ts:347

Clear error history

#### Returns

`void`

***

### createErrorReport()

> **createErrorReport**(): `object`

Defined in: core/ErrorBoundary.ts:409

Create error report

#### Returns

`object`

##### timestamp

> **timestamp**: `string`

##### errors

> **errors**: `object`[]
