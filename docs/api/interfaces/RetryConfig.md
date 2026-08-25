[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / RetryConfig

# Interface: RetryConfig

Defined in: core/RetryPolicy.ts:1

## Properties

### maxAttempts?

> `optional` **maxAttempts**: `number`

Defined in: core/RetryPolicy.ts:2

***

### initialDelayMs?

> `optional` **initialDelayMs**: `number`

Defined in: core/RetryPolicy.ts:3

***

### maxDelayMs?

> `optional` **maxDelayMs**: `number`

Defined in: core/RetryPolicy.ts:4

***

### backoffMultiplier?

> `optional` **backoffMultiplier**: `number`

Defined in: core/RetryPolicy.ts:5

***

### shouldRetry()?

> `optional` **shouldRetry**: (`error`, `attempt`) => `boolean`

Defined in: core/RetryPolicy.ts:6

#### Parameters

##### error

`Error`

##### attempt

`number`

#### Returns

`boolean`
