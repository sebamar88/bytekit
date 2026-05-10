[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / Profiler

# Class: Profiler

Defined in: core/Profiler.ts:1

## Constructors

### Constructor

> **new Profiler**(`namespace?`): `Profiler`

Defined in: core/Profiler.ts:6

#### Parameters

##### namespace?

`string`

#### Returns

`Profiler`

## Methods

### start()

> **start**(`label`): `void`

Defined in: core/Profiler.ts:10

#### Parameters

##### label

`string`

#### Returns

`void`

***

### end()

> **end**(`label`): `void`

Defined in: core/Profiler.ts:14

#### Parameters

##### label

`string`

#### Returns

`void`

***

### summary()

> **summary**(): `Record`\<`string`, `number`\> \| `Record`\<`string`, `Record`\<`string`, `number`\>\>

Defined in: core/Profiler.ts:29

#### Returns

`Record`\<`string`, `number`\> \| `Record`\<`string`, `Record`\<`string`, `number`\>\>
