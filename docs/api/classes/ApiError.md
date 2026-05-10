[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ApiError

# Class: ApiError

Defined in: core/ApiClient.ts:95

## Extends

- `Error`

## Constructors

### Constructor

> **new ApiError**(`status`, `statusText`, `message`, `body?`, `isTimeout?`): `ApiError`

Defined in: core/ApiClient.ts:96

#### Parameters

##### status

`number`

##### statusText

`string`

##### message

`string`

##### body?

`unknown`

##### isTimeout?

`boolean` = `false`

#### Returns

`ApiError`

#### Overrides

`Error.constructor`

## Properties

### status

> `readonly` **status**: `number`

Defined in: core/ApiClient.ts:97

***

### statusText

> `readonly` **statusText**: `string`

Defined in: core/ApiClient.ts:98

***

### body?

> `readonly` `optional` **body**: `unknown`

Defined in: core/ApiClient.ts:100

***

### isTimeout

> `readonly` **isTimeout**: `boolean` = `false`

Defined in: core/ApiClient.ts:101

## Accessors

### details

#### Get Signature

> **get** **details**(): `object`

Defined in: core/ApiClient.ts:115

Información completa del error para debugging

##### Returns

`object`

###### status

> **status**: `number`

###### statusText

> **statusText**: `string`

###### message

> **message**: `string`

###### body

> **body**: `unknown`

###### isTimeout

> **isTimeout**: `boolean`

## Methods

### toString()

> **toString**(): `string`

Defined in: core/ApiClient.ts:128

toString mejorado para debugging

#### Returns

`string`

***

### toJSON()

> **toJSON**(): `object`

Defined in: core/ApiClient.ts:152

Serialización para JSON.stringify()

#### Returns

`object`

##### status

> **status**: `number`

##### statusText

> **statusText**: `string`

##### message

> **message**: `string`

##### body

> **body**: `unknown`

##### isTimeout

> **isTimeout**: `boolean`
