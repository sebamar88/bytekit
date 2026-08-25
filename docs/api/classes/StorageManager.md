[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / StorageManager

# Class: StorageManager

Defined in: helpers/StorageUtils.ts:1

## Constructors

### Constructor

> **new StorageManager**(`storage`): `StorageManager`

Defined in: helpers/StorageUtils.ts:2

#### Parameters

##### storage

`Storage` = `localStorage`

#### Returns

`StorageManager`

## Methods

### set()

> **set**\<`T`\>(`key`, `value`, `ttlMs?`): `void`

Defined in: helpers/StorageUtils.ts:4

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

##### value

`T`

##### ttlMs?

`number`

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`key`): `T` \| `null`

Defined in: helpers/StorageUtils.ts:9

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

#### Returns

`T` \| `null`

***

### remove()

> **remove**(`key`): `void`

Defined in: helpers/StorageUtils.ts:24

#### Parameters

##### key

`string`

#### Returns

`void`

***

### clear()

> **clear**(): `void`

Defined in: helpers/StorageUtils.ts:28

#### Returns

`void`
