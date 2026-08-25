[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / CircuitBreaker

# Class: CircuitBreaker

Defined in: core/RetryPolicy.ts:18

## Constructors

### Constructor

> **new CircuitBreaker**(`config`): `CircuitBreaker`

Defined in: core/RetryPolicy.ts:28

#### Parameters

##### config

[`CircuitBreakerConfig`](../interfaces/CircuitBreakerConfig.md) = `{}`

#### Returns

`CircuitBreaker`

## Methods

### execute()

> **execute**\<`T`\>(`fn`): `Promise`\<`T`\>

Defined in: core/RetryPolicy.ts:35

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

***

### getState()

> **getState**(): [`CircuitBreakerState`](../type-aliases/CircuitBreakerState.md)

Defined in: core/RetryPolicy.ts:100

#### Returns

[`CircuitBreakerState`](../type-aliases/CircuitBreakerState.md)

***

### reset()

> **reset**(): `void`

Defined in: core/RetryPolicy.ts:104

#### Returns

`void`
