[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / RetryPolicy

# Class: RetryPolicy

Defined in: core/RetryPolicy.ts:112

## Constructors

### Constructor

> **new RetryPolicy**(`config`): `RetryPolicy`

Defined in: core/RetryPolicy.ts:119

#### Parameters

##### config

[`RetryConfig`](../interfaces/RetryConfig.md) = `{}`

#### Returns

`RetryPolicy`

## Methods

### execute()

> **execute**\<`T`\>(`fn`): `Promise`\<`T`\>

Defined in: core/RetryPolicy.ts:128

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>

***

### getConfig()

> **getConfig**(): `object`

Defined in: core/RetryPolicy.ts:183

#### Returns

`object`

##### maxAttempts

> **maxAttempts**: `number`

##### initialDelayMs

> **initialDelayMs**: `number`

##### maxDelayMs

> **maxDelayMs**: `number`

##### backoffMultiplier

> **backoffMultiplier**: `number`

##### shouldRetry()

> **shouldRetry**: (`error`, `attempt`) => `boolean`

###### Parameters

###### error

`Error`

###### attempt

`number`

###### Returns

`boolean`
