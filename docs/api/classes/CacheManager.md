[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / CacheManager

# Class: CacheManager\<T\>

Defined in: helpers/CacheManager.ts:165

Multi-tier cache manager

## Type Parameters

### T

`T` = `unknown`

## Constructors

### Constructor

> **new CacheManager**\<`T`\>(`options`): `CacheManager`\<`T`\>

Defined in: helpers/CacheManager.ts:170

#### Parameters

##### options

[`CacheManagerOptions`](../interfaces/CacheManagerOptions.md) = `{}`

#### Returns

`CacheManager`\<`T`\>

## Methods

### set()

> **set**(`key`, `value`, `ttl`): `void`

Defined in: helpers/CacheManager.ts:181

Set value in cache

#### Parameters

##### key

`string`

##### value

`T`

##### ttl

`number` = `...`

#### Returns

`void`

***

### get()

> **get**(`key`): `T` \| `null`

Defined in: helpers/CacheManager.ts:191

Get value from cache

#### Parameters

##### key

`string`

#### Returns

`T` \| `null`

***

### has()

> **has**(`key`): `boolean`

Defined in: helpers/CacheManager.ts:212

Check if key exists

#### Parameters

##### key

`string`

#### Returns

`boolean`

***

### delete()

> **delete**(`key`): `void`

Defined in: helpers/CacheManager.ts:219

Delete key

#### Parameters

##### key

`string`

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: helpers/CacheManager.ts:229

Clear all cache

#### Returns

`void`

***

### getStats()

> **getStats**(): [`CacheStatistics`](../interfaces/CacheStatistics.md)

Defined in: helpers/CacheManager.ts:239

Get cache statistics

#### Returns

[`CacheStatistics`](../interfaces/CacheStatistics.md)

***

### getOrCompute()

> **getOrCompute**(`key`, `compute`, `ttl?`): `Promise`\<`T`\>

Defined in: helpers/CacheManager.ts:246

Get or compute value

#### Parameters

##### key

`string`

##### compute

() => `Promise`\<`T`\>

##### ttl?

`number`

#### Returns

`Promise`\<`T`\>

***

### clearPattern()

> **clearPattern**(`_pattern`): `Promise`\<`void`\>

Defined in: helpers/CacheManager.ts:262

Invalidate keys matching pattern

#### Parameters

##### \_pattern

`string`

#### Returns

`Promise`\<`void`\>
