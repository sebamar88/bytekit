[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / EventEmitter

# Class: EventEmitter\<Events\>

Defined in: helpers/EventEmitter.ts:20

Event emitter for pub/sub communication

## Type Parameters

### Events

`Events` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Constructors

### Constructor

> **new EventEmitter**\<`Events`\>(`options`): `EventEmitter`\<`Events`\>

Defined in: helpers/EventEmitter.ts:29

#### Parameters

##### options

[`EventEmitterOptions`](../interfaces/EventEmitterOptions.md) = `{}`

#### Returns

`EventEmitter`\<`Events`\>

## Methods

### on()

> **on**\<`K`\>(`event`, `listener`): `this`

Defined in: helpers/EventEmitter.ts:37

Register event listener

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### listener

[`EventListener`](../type-aliases/EventListener.md)\<`Events`\[`K`\]\>

#### Returns

`this`

***

### once()

> **once**\<`K`\>(`event`, `listener`): `this`

Defined in: helpers/EventEmitter.ts:61

Register one-time event listener

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### listener

[`EventListener`](../type-aliases/EventListener.md)\<`Events`\[`K`\]\>

#### Returns

`this`

***

### off()

> **off**\<`K`\>(`event`, `listener`): `this`

Defined in: helpers/EventEmitter.ts:89

Remove event listener

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### listener

[`EventListener`](../type-aliases/EventListener.md)\<`Events`\[`K`\]\>

#### Returns

`this`

***

### removeAllListeners()

> **removeAllListeners**\<`K`\>(`event?`): `this`

Defined in: helpers/EventEmitter.ts:128

Remove all listeners for event

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event?

`K`

#### Returns

`this`

***

### emit()

> **emit**\<`K`\>(`event`, `data`): `Promise`\<`boolean`\>

Defined in: helpers/EventEmitter.ts:142

Emit event

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### data

`Events`\[`K`\]

#### Returns

`Promise`\<`boolean`\>

***

### emitSync()

> **emitSync**\<`K`\>(`event`, `data`): `boolean`

Defined in: helpers/EventEmitter.ts:185

Emit event synchronously

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

##### data

`Events`\[`K`\]

#### Returns

`boolean`

***

### onError()

> **onError**(`listener`): `this`

Defined in: helpers/EventEmitter.ts:209

Register error handler

#### Parameters

##### listener

[`EventListenerWithError`](../type-aliases/EventListenerWithError.md)

#### Returns

`this`

***

### listenerCount()

> **listenerCount**\<`K`\>(`event`): `number`

Defined in: helpers/EventEmitter.ts:230

Get listener count for event

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

#### Returns

`number`

***

### getListeners()

> **getListeners**\<`K`\>(`event`): [`EventListener`](../type-aliases/EventListener.md)\<`Events`\[`K`\]\>[]

Defined in: helpers/EventEmitter.ts:238

Get all listeners for event

#### Type Parameters

##### K

`K` *extends* `string` \| `number` \| `symbol`

#### Parameters

##### event

`K`

#### Returns

[`EventListener`](../type-aliases/EventListener.md)\<`Events`\[`K`\]\>[]

***

### eventNames()

> **eventNames**(): keyof `Events`[]

Defined in: helpers/EventEmitter.ts:248

Get all event names

#### Returns

keyof `Events`[]

***

### setMaxListeners()

> **setMaxListeners**(`n`): `this`

Defined in: helpers/EventEmitter.ts:255

Set max listeners

#### Parameters

##### n

`number`

#### Returns

`this`

***

### getMaxListeners()

> **getMaxListeners**(): `number`

Defined in: helpers/EventEmitter.ts:263

Get max listeners

#### Returns

`number`
