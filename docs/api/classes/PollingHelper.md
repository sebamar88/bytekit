[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / PollingHelper

# Class: PollingHelper\<T\>

Defined in: helpers/PollingHelper.ts:43

Polling helper for repeated operations with backoff

## Type Parameters

### T

`T` = `unknown`

## Constructors

### Constructor

> **new PollingHelper**\<`T`\>(`fn`, `options`): `PollingHelper`\<`T`\>

Defined in: helpers/PollingHelper.ts:52

#### Parameters

##### fn

() => `Promise`\<`T`\>

##### options

[`PollingOptions`](../interfaces/PollingOptions.md)\<`T`\> = `{}`

#### Returns

`PollingHelper`\<`T`\>

## Methods

### start()

> **start**(): `Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

Defined in: helpers/PollingHelper.ts:173

Start polling

#### Returns

`Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

***

### startWithAbort()

> **startWithAbort**(): `Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

Defined in: helpers/PollingHelper.ts:237

Start polling with abort capability

#### Returns

`Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

***

### abort()

> **abort**(): `void`

Defined in: helpers/PollingHelper.ts:245

Abort polling

#### Returns

`void`

***

### poll()

> `static` **poll**\<`T`\>(`fn`, `options`): `Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

Defined in: helpers/PollingHelper.ts:353

Poll until condition is met

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `Promise`\<`T`\>

##### options

[`PollingOptions`](../interfaces/PollingOptions.md)\<`T`\> = `{}`

#### Returns

`Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

***

### pollWithBackoff()

> `static` **pollWithBackoff**\<`T`\>(`fn`, `options`): `Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

Defined in: helpers/PollingHelper.ts:364

Poll with exponential backoff

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `Promise`\<`T`\>

##### options

[`PollingOptions`](../interfaces/PollingOptions.md)\<`T`\> = `{}`

#### Returns

`Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

***

### pollWithLinearBackoff()

> `static` **pollWithLinearBackoff**\<`T`\>(`fn`, `options`): `Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>

Defined in: helpers/PollingHelper.ts:379

Poll with linear backoff

#### Type Parameters

##### T

`T`

#### Parameters

##### fn

() => `Promise`\<`T`\>

##### options

[`PollingOptions`](../interfaces/PollingOptions.md)\<`T`\> = `{}`

#### Returns

`Promise`\<[`PollingResult`](../interfaces/PollingResult.md)\<`T`\>\>
