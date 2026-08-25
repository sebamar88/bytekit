[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / WebSocketHelper

# Class: WebSocketHelper

Defined in: helpers/WebSocketHelper.ts:18

## Constructors

### Constructor

> **new WebSocketHelper**(`url`, `options`): `WebSocketHelper`

Defined in: helpers/WebSocketHelper.ts:29

#### Parameters

##### url

`string`

##### options

[`WebSocketOptions`](../interfaces/WebSocketOptions.md) = `{}`

#### Returns

`WebSocketHelper`

## Methods

### connect()

> **connect**(): `Promise`\<`void`\>

Defined in: helpers/WebSocketHelper.ts:43

Connect to WebSocket

#### Returns

`Promise`\<`void`\>

***

### send()

> **send**\<`T`\>(`type`, `data`): `void`

Defined in: helpers/WebSocketHelper.ts:81

Send a message

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### type

`string`

##### data

`T`

#### Returns

`void`

***

### on()

> **on**\<`T`\>(`type`, `handler`): () => `void`

Defined in: helpers/WebSocketHelper.ts:98

Subscribe to a message type

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### type

`string`

##### handler

[`WebSocketEventHandler`](../type-aliases/WebSocketEventHandler.md)\<`T`\>

#### Returns

> (): `void`

##### Returns

`void`

***

### onError()

> **onError**(`handler`): () => `void`

Defined in: helpers/WebSocketHelper.ts:120

Subscribe to errors

#### Parameters

##### handler

[`WebSocketErrorHandler`](../type-aliases/WebSocketErrorHandler.md)

#### Returns

> (): `void`

##### Returns

`void`

***

### request()

> **request**\<`TRequest`, `TResponse`\>(`type`, `data`, `responseType?`): `Promise`\<`TResponse`\>

Defined in: helpers/WebSocketHelper.ts:128

Send a message and wait for response

#### Type Parameters

##### TRequest

`TRequest`

##### TResponse

`TResponse`

#### Parameters

##### type

`string`

##### data

`TRequest`

##### responseType?

`string`

#### Returns

`Promise`\<`TResponse`\>

***

### close()

> **close**(): `void`

Defined in: helpers/WebSocketHelper.ts:161

Close connection

#### Returns

`void`

***

### isConnected()

> **isConnected**(): `boolean`

Defined in: helpers/WebSocketHelper.ts:173

Check if connected

#### Returns

`boolean`

***

### getState()

> **getState**(): `number`

Defined in: helpers/WebSocketHelper.ts:180

Get connection state

#### Returns

`number`
