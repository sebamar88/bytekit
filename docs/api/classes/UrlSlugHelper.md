[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / UrlSlugHelper

# Class: UrlSlugHelper

Defined in: helpers/UrlSlugHelper.ts:21

## Constructors

### Constructor

> **new UrlSlugHelper**(): `UrlSlugHelper`

#### Returns

`UrlSlugHelper`

## Methods

### generate()

> `static` **generate**(`value`, `__namedParameters`): `string`

Defined in: helpers/UrlSlugHelper.ts:28

Converts a string into a URL-friendly slug.
Examples: 
- "Mejores celulares para 2026" -> "mejores-celulares-para-2026"
- "Café & Té" -> "cafe-te"

#### Parameters

##### value

`string` | `null` | `undefined`

##### \_\_namedParameters

[`SlugifyOptions`](../interfaces/SlugifyOptions.md) = `{}`

#### Returns

`string`
