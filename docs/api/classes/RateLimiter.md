[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / RateLimiter

# Class: RateLimiter

Defined in: core/RateLimiter.ts:18

Token bucket rate limiter
Allows bursts but maintains average rate

## Constructors

### Constructor

> **new RateLimiter**(`config`): `RateLimiter`

Defined in: core/RateLimiter.ts:25

#### Parameters

##### config

[`RateLimiterConfig`](../interfaces/RateLimiterConfig.md) = `{}`

#### Returns

`RateLimiter`

## Methods

### isAllowed()

> **isAllowed**(`url`): `boolean`

Defined in: core/RateLimiter.ts:35

Check if request is allowed

#### Parameters

##### url

`string`

#### Returns

`boolean`

***

### getStats()

> **getStats**(`url`): [`RateLimiterStats`](../interfaces/RateLimiterStats.md)

Defined in: core/RateLimiter.ts:62

Get rate limiter stats for a URL

#### Parameters

##### url

`string`

#### Returns

[`RateLimiterStats`](../interfaces/RateLimiterStats.md)

***

### reset()

> **reset**(`url`): `void`

Defined in: core/RateLimiter.ts:97

Reset rate limiter for a specific URL

#### Parameters

##### url

`string`

#### Returns

`void`

***

### resetAll()

> **resetAll**(): `void`

Defined in: core/RateLimiter.ts:105

Reset all rate limiters

#### Returns

`void`

***

### waitForAllowance()

> **waitForAllowance**(`url`): `Promise`\<`void`\>

Defined in: core/RateLimiter.ts:112

Wait until request is allowed (blocking)

#### Parameters

##### url

`string`

#### Returns

`Promise`\<`void`\>
