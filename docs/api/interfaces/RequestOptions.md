[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / RequestOptions

# Interface: RequestOptions\<TResponse\>

Defined in: core/ApiClient.ts:48

## Extends

- `Omit`\<`RequestInit`, `"body"`\>

## Type Parameters

### TResponse

`TResponse` = `unknown`

## Properties

### searchParams?

> `optional` **searchParams**: `Record`\<`string`, [`QueryParam`](../type-aliases/QueryParam.md)\>

Defined in: core/ApiClient.ts:49

***

### body?

> `optional` **body**: `string` \| `Record`\<`string`, `unknown`\> \| `ArrayBuffer` \| `FormData` \| `Blob`

Defined in: core/ApiClient.ts:50

***

### errorLocale?

> `optional` **errorLocale**: [`Locale`](../type-aliases/Locale.md)

Defined in: core/ApiClient.ts:51

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: core/ApiClient.ts:52

***

### validateResponse?

> `optional` **validateResponse**: [`ValidationSchema`](ValidationSchema.md) \| [`SchemaAdapter`](SchemaAdapter.md)\<`TResponse`\>

Defined in: core/ApiClient.ts:53

***

### skipRetry?

> `optional` **skipRetry**: `boolean`

Defined in: core/ApiClient.ts:54

***

### skipInterceptors?

> `optional` **skipInterceptors**: `boolean`

Defined in: core/ApiClient.ts:55

***

### logHeaders?

> `optional` **logHeaders**: `boolean`

Defined in: core/ApiClient.ts:56
