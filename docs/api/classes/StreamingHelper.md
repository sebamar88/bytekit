[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / StreamingHelper

# Class: StreamingHelper

Defined in: helpers/StreamingHelper.ts:15

## Constructors

### Constructor

> **new StreamingHelper**(): `StreamingHelper`

#### Returns

`StreamingHelper`

## Methods

### streamJsonLines()

> `static` **streamJsonLines**\<`T`\>(`endpoint`, `options`): `Promise`\<[`StreamResponse`](../interfaces/StreamResponse.md)\<`T`\>\>

Defined in: helpers/StreamingHelper.ts:61

Stream JSON lines from an endpoint
Each line should be a valid JSON object

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### options

[`StreamOptions`](../interfaces/StreamOptions.md) = `{}`

#### Returns

`Promise`\<[`StreamResponse`](../interfaces/StreamResponse.md)\<`T`\>\>

***

### streamSSE()

> `static` **streamSSE**\<`T`\>(`endpoint`, `options`): `object`

Defined in: helpers/StreamingHelper.ts:136

Stream Server-Sent Events (SSE)

#### Type Parameters

##### T

`T`

#### Parameters

##### endpoint

`string`

##### options

[`StreamOptions`](../interfaces/StreamOptions.md) & `object` = `{}`

#### Returns

`object`

##### subscribe()

> **subscribe**: (`callback`) => () => `void`

###### Parameters

###### callback

(`data`) => `void`

###### Returns

> (): `void`

###### Returns

`void`

##### close()

> **close**: () => `void`

###### Returns

`void`

***

### downloadStream()

> `static` **downloadStream**(`endpoint`, `options`): `Promise`\<`Blob`\>

Defined in: helpers/StreamingHelper.ts:195

Download file as stream with progress tracking

#### Parameters

##### endpoint

`string`

##### options

[`StreamOptions`](../interfaces/StreamOptions.md) & `object` = `{}`

#### Returns

`Promise`\<`Blob`\>
