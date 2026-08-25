[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / SlidingWindowRateLimiter

# Class: SlidingWindowRateLimiter

Defined in: core/RateLimiter.ts:125

Sliding window rate limiter
More accurate but uses more memory

## Constructors

### Constructor

> **new SlidingWindowRateLimiter**(`config`): `SlidingWindowRateLimiter`

Defined in: core/RateLimiter.ts:131

#### Parameters

##### config

[`RateLimiterConfig`](../interfaces/RateLimiterConfig.md) = `{}`

#### Returns

`SlidingWindowRateLimiter`

## Methods

### isAllowed()

> **isAllowed**(`url`): `boolean`

Defined in: core/RateLimiter.ts:141

Check if request is allowed

#### Parameters

##### url

`string`

#### Returns

`boolean`

***

### getStats()

> **getStats**(`url`): [`RateLimiterStats`](../interfaces/RateLimiterStats.md)

Defined in: core/RateLimiter.ts:167

Get rate limiter stats

#### Parameters

##### url

`string`

#### Returns

[`RateLimiterStats`](../interfaces/RateLimiterStats.md)

***

### reset()

> **reset**(`url`): `void`

Defined in: core/RateLimiter.ts:193

Reset rate limiter for a specific URL

#### Parameters

##### url

`string`

#### Returns

`void`

***

### resetAll()

> **resetAll**(): `void`

Defined in: core/RateLimiter.ts:201

Reset all rate limiters

#### Returns

`void`

***

### waitForAllowance()

> **waitForAllowance**(`url`): `Promise`\<`void`\>

Defined in: core/RateLimiter.ts:208

Wait until request is allowed

#### Parameters

##### url

`string`

#### Returns

`Promise`\<`void`\>
