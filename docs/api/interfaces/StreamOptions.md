[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / StreamOptions

# Interface: StreamOptions

Defined in: helpers/StreamingHelper.ts:1

## Properties

### timeout?

> `optional` **timeout**: `number`

Defined in: helpers/StreamingHelper.ts:2

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: helpers/StreamingHelper.ts:3

***

### onChunk()?

> `optional` **onChunk**: (`chunk`) => `void`

Defined in: helpers/StreamingHelper.ts:4

#### Parameters

##### chunk

`string`

#### Returns

`void`

***

### onError()?

> `optional` **onError**: (`error`) => `void`

Defined in: helpers/StreamingHelper.ts:5

#### Parameters

##### error

`Error`

#### Returns

`void`

***

### onComplete()?

> `optional` **onComplete**: () => `void`

Defined in: helpers/StreamingHelper.ts:6

#### Returns

`void`
