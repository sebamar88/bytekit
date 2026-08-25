[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ValidationSchema

# Interface: ValidationSchema

Defined in: core/ResponseValidator.ts:1

## Properties

### type?

> `optional` **type**: `"string"` \| `"number"` \| `"boolean"` \| `"object"` \| `"array"`

Defined in: core/ResponseValidator.ts:2

***

### required?

> `optional` **required**: `boolean`

Defined in: core/ResponseValidator.ts:3

***

### properties?

> `optional` **properties**: `Record`\<`string`, `ValidationSchema`\>

Defined in: core/ResponseValidator.ts:4

***

### items?

> `optional` **items**: `ValidationSchema`

Defined in: core/ResponseValidator.ts:5

***

### minLength?

> `optional` **minLength**: `number`

Defined in: core/ResponseValidator.ts:6

***

### maxLength?

> `optional` **maxLength**: `number`

Defined in: core/ResponseValidator.ts:7

***

### minimum?

> `optional` **minimum**: `number`

Defined in: core/ResponseValidator.ts:8

***

### maximum?

> `optional` **maximum**: `number`

Defined in: core/ResponseValidator.ts:9

***

### pattern?

> `optional` **pattern**: `string` \| `RegExp`

Defined in: core/ResponseValidator.ts:10

***

### enum?

> `optional` **enum**: `unknown`[]

Defined in: core/ResponseValidator.ts:11

***

### custom()?

> `optional` **custom**: (`value`) => `string` \| `boolean`

Defined in: core/ResponseValidator.ts:12

#### Parameters

##### value

`unknown`

#### Returns

`string` \| `boolean`
