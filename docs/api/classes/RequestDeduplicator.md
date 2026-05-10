[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / RequestDeduplicator

# Class: RequestDeduplicator

Defined in: core/RequestDeduplicator.ts:15

Deduplicates in-flight requests
Multiple consumers of the same request share the same response

## Constructors

### Constructor

> **new RequestDeduplicator**(`config`): `RequestDeduplicator`

Defined in: core/RequestDeduplicator.ts:23

#### Parameters

##### config

[`DeduplicatorConfig`](../interfaces/DeduplicatorConfig.md) = `{}`

#### Returns

`RequestDeduplicator`

## Methods

### execute()

> **execute**\<`T`\>(`url`, `fn`, `options?`): `Promise`\<`T`\>

Defined in: core/RequestDeduplicator.ts:31

Execute request with deduplication
If same request is in-flight, returns the same promise

#### Type Parameters

##### T

`T`

#### Parameters

##### url

`string`

##### fn

() => `Promise`\<`T`\>

##### options?

`Record`\<`string`, `unknown`\>

#### Returns

`Promise`\<`T`\>

***

### getStats()

> **getStats**(): [`DeduplicatorStats`](../interfaces/DeduplicatorStats.md)

Defined in: core/RequestDeduplicator.ts:68

Get deduplication statistics

#### Returns

[`DeduplicatorStats`](../interfaces/DeduplicatorStats.md)

***

### getInFlightCount()

> **getInFlightCount**(): `number`

Defined in: core/RequestDeduplicator.ts:82

Get number of in-flight requests

#### Returns

`number`

***

### clear()

> **clear**(): `void`

Defined in: core/RequestDeduplicator.ts:89

Clear all in-flight requests

#### Returns

`void`

***

### resetStats()

> **resetStats**(): `void`

Defined in: core/RequestDeduplicator.ts:97

Reset statistics

#### Returns

`void`
