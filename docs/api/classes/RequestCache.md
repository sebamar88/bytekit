[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / RequestCache

# Class: RequestCache

Defined in: core/RequestCache.ts:21

## Constructors

### Constructor

> **new RequestCache**(`config`): `RequestCache`

Defined in: core/RequestCache.ts:31

#### Parameters

##### config

[`CacheConfig`](../interfaces/CacheConfig.md) = `{}`

#### Returns

`RequestCache`

## Methods

### get()

> **get**\<`T`\>(`url`, `options?`): `T` \| `null`

Defined in: core/RequestCache.ts:40

Get cached data

#### Type Parameters

##### T

`T`

#### Parameters

##### url

`string`

##### options?

`Record`\<`string`, `unknown`\>

#### Returns

`T` \| `null`

***

### set()

> **set**\<`T`\>(`url`, `data`, `ttl?`, `options?`): `void`

Defined in: core/RequestCache.ts:68

Set cached data

#### Type Parameters

##### T

`T`

#### Parameters

##### url

`string`

##### data

`T`

##### ttl?

`number`

##### options?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### isStale()

> **isStale**(`url`, `options?`): `boolean`

Defined in: core/RequestCache.ts:88

Check if data is stale (expired but still usable)

#### Parameters

##### url

`string`

##### options?

`Record`\<`string`, `unknown`\>

#### Returns

`boolean`

***

### invalidate()

> **invalidate**(`url`, `options?`): `void`

Defined in: core/RequestCache.ts:102

Invalidate cache entry

#### Parameters

##### url

`string`

##### options?

`Record`\<`string`, `unknown`\>

#### Returns

`void`

***

### invalidatePattern()

> **invalidatePattern**(`pattern`): `void`

Defined in: core/RequestCache.ts:110

Invalidate by pattern (e.g., "/users/*")

#### Parameters

##### pattern

`string`

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: core/RequestCache.ts:122

Clear all cache

#### Returns

`void`

***

### getStats()

> **getStats**(): [`CacheStats`](../interfaces/CacheStats.md)

Defined in: core/RequestCache.ts:130

Get cache statistics

#### Returns

[`CacheStats`](../interfaces/CacheStats.md)

***

### getSize()

> **getSize**(): `number`

Defined in: core/RequestCache.ts:143

Get cache size in bytes (approximate)

#### Returns

`number`

***

### prune()

> **prune**(): `number`

Defined in: core/RequestCache.ts:154

Prune expired entries

#### Returns

`number`
