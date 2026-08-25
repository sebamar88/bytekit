[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / CircuitBreakerConfig

# Interface: CircuitBreakerConfig

Defined in: core/RetryPolicy.ts:9

## Properties

### failureThreshold?

> `optional` **failureThreshold**: `number`

Defined in: core/RetryPolicy.ts:10

***

### successThreshold?

> `optional` **successThreshold**: `number`

Defined in: core/RetryPolicy.ts:11

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: core/RetryPolicy.ts:12

***

### errorMessageFormatter()?

> `optional` **errorMessageFormatter**: (`ms`) => `string`

Defined in: core/RetryPolicy.ts:13

#### Parameters

##### ms

`number`

#### Returns

`string`
