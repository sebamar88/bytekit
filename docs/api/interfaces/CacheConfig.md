[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / CacheConfig

# Interface: CacheConfig

Defined in: core/RequestCache.ts:8

## Properties

### ttl?

> `optional` **ttl**: `number`

Defined in: core/RequestCache.ts:9

***

### staleWhileRevalidate?

> `optional` **staleWhileRevalidate**: `number`

Defined in: core/RequestCache.ts:10

***

### keyGenerator()?

> `optional` **keyGenerator**: (`url`, `options?`) => `string`

Defined in: core/RequestCache.ts:11

#### Parameters

##### url

`string`

##### options?

`Record`\<`string`, `unknown`\>

#### Returns

`string`
