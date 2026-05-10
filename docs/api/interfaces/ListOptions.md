[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ListOptions

# Interface: ListOptions\<TFilter, TResponse\>

Defined in: core/ApiClient.ts:74

## Extends

- `Omit`\<[`RequestOptions`](RequestOptions.md)\<`TResponse`\>, `"searchParams"`\>

## Type Parameters

### TFilter

`TFilter` *extends* [`FilterParams`](FilterParams.md) = [`FilterParams`](FilterParams.md)

### TResponse

`TResponse` = `unknown`

## Properties

### body?

> `optional` **body**: `string` \| `Record`\<`string`, `unknown`\> \| `ArrayBuffer` \| `FormData` \| `Blob`

Defined in: core/ApiClient.ts:50

#### Inherited from

`Omit.body`

***

### errorLocale?

> `optional` **errorLocale**: [`Locale`](../type-aliases/Locale.md)

Defined in: core/ApiClient.ts:51

#### Inherited from

`Omit.errorLocale`

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: core/ApiClient.ts:52

#### Inherited from

`Omit.timeoutMs`

***

### validateResponse?

> `optional` **validateResponse**: [`ValidationSchema`](ValidationSchema.md) \| [`SchemaAdapter`](SchemaAdapter.md)\<`TResponse`\>

Defined in: core/ApiClient.ts:53

#### Inherited from

`Omit.validateResponse`

***

### skipRetry?

> `optional` **skipRetry**: `boolean`

Defined in: core/ApiClient.ts:54

#### Inherited from

`Omit.skipRetry`

***

### skipInterceptors?

> `optional` **skipInterceptors**: `boolean`

Defined in: core/ApiClient.ts:55

#### Inherited from

`Omit.skipInterceptors`

***

### logHeaders?

> `optional` **logHeaders**: `boolean`

Defined in: core/ApiClient.ts:56

#### Inherited from

`Omit.logHeaders`

***

### pagination?

> `optional` **pagination**: [`PaginationParams`](PaginationParams.md)

Defined in: core/ApiClient.ts:78

***

### sort?

> `optional` **sort**: [`SortParams`](SortParams.md)

Defined in: core/ApiClient.ts:79

***

### filters?

> `optional` **filters**: `TFilter`

Defined in: core/ApiClient.ts:80
