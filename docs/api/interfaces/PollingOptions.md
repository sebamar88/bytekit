[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / PollingOptions

# Interface: PollingOptions\<T\>

Defined in: helpers/PollingHelper.ts:6

Polling helper with intelligent backoff and stop conditions
Adaptive polling for status checks, webhooks, etc.

## Type Parameters

### T

`T` = `unknown`

## Properties

### interval?

> `optional` **interval**: `number`

Defined in: helpers/PollingHelper.ts:7

***

### maxAttempts?

> `optional` **maxAttempts**: `number`

Defined in: helpers/PollingHelper.ts:8

***

### maxDuration?

> `optional` **maxDuration**: `number`

Defined in: helpers/PollingHelper.ts:9

***

### backoffMultiplier?

> `optional` **backoffMultiplier**: `number`

Defined in: helpers/PollingHelper.ts:10

***

### maxBackoffInterval?

> `optional` **maxBackoffInterval**: `number`

Defined in: helpers/PollingHelper.ts:11

***

### stopCondition()?

> `optional` **stopCondition**: (`result`) => `boolean`

Defined in: helpers/PollingHelper.ts:12

#### Parameters

##### result

`T`

#### Returns

`boolean`

***

### onAttempt()?

> `optional` **onAttempt**: (`attempt`, `result?`, `error?`) => `void`

Defined in: helpers/PollingHelper.ts:13

#### Parameters

##### attempt

`number`

##### result?

`T`

##### error?

`Error`

#### Returns

`void`

***

### onSuccess()?

> `optional` **onSuccess**: (`result`, `attempts`) => `void`

Defined in: helpers/PollingHelper.ts:14

#### Parameters

##### result

`T`

##### attempts

`number`

#### Returns

`void`

***

### onError()?

> `optional` **onError**: (`error`, `attempts`) => `void`

Defined in: helpers/PollingHelper.ts:15

#### Parameters

##### error

`Error`

##### attempts

`number`

#### Returns

`void`

***

### jitter?

> `optional` **jitter**: `number` \| `boolean`

Defined in: helpers/PollingHelper.ts:17

Add random jitter to intervals (true = 10%, number = custom percentage 0-100)

***

### attemptTimeout?

> `optional` **attemptTimeout**: `number`

Defined in: helpers/PollingHelper.ts:19

Timeout for each individual attempt in milliseconds

***

### retryOnError?

> `optional` **retryOnError**: `boolean`

Defined in: helpers/PollingHelper.ts:21

Whether to retry on error (default: true)

***

### exponentialBase?

> `optional` **exponentialBase**: `number`

Defined in: helpers/PollingHelper.ts:23

Base for exponential backoff (default: 2)
