[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ApiClient

# Class: ApiClient

Defined in: core/ApiClient.ts:198

## Constructors

### Constructor

> **new ApiClient**(`__namedParameters`): `ApiClient`

Defined in: core/ApiClient.ts:215

#### Parameters

##### \_\_namedParameters

[`ApiClientConfig`](../interfaces/ApiClientConfig.md)

#### Returns

`ApiClient`

## Methods

### get()

> **get**\<`T`\>(`path`, `options?`): `Promise`\<`T`\>

Defined in: core/ApiClient.ts:266

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### options?

[`RequestOptions`](../interfaces/RequestOptions.md)\<`T`\>

#### Returns

`Promise`\<`T`\>

***

### post()

> **post**\<`T`\>(`path`, `bodyOrOptions?`): `Promise`\<`T`\>

Defined in: core/ApiClient.ts:282

POST request - Acepta body directamente o RequestOptions

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### bodyOrOptions?

`unknown`

#### Returns

`Promise`\<`T`\>

#### Example

```ts
// Forma simple (body directo)
await client.post("/api/users", { name: "John" })

// Forma avanzada (con options)
await client.post("/api/users", {
  body: { name: "John" },
  headers: { "X-Custom": "value" }
})
```

***

### put()

> **put**\<`T`\>(`path`, `bodyOrOptions?`): `Promise`\<`T`\>

Defined in: core/ApiClient.ts:290

PUT request - Acepta body directamente o RequestOptions

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### bodyOrOptions?

`unknown`

#### Returns

`Promise`\<`T`\>

***

### patch()

> **patch**\<`T`\>(`path`, `bodyOrOptions?`): `Promise`\<`T`\>

Defined in: core/ApiClient.ts:298

PATCH request - Acepta body directamente o RequestOptions

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### bodyOrOptions?

`unknown`

#### Returns

`Promise`\<`T`\>

***

### delete()

> **delete**\<`T`\>(`path`, `options?`): `Promise`\<`T`\>

Defined in: core/ApiClient.ts:303

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### options?

[`RequestOptions`](../interfaces/RequestOptions.md)\<`T`\>

#### Returns

`Promise`\<`T`\>

***

### getList()

> **getList**\<`T`, `TFilter`\>(`path`, `options?`): `Promise`\<[`PaginatedResponse`](../interfaces/PaginatedResponse.md)\<`T`\>\>

Defined in: core/ApiClient.ts:310

#### Type Parameters

##### T

`T`

##### TFilter

`TFilter` *extends* [`FilterParams`](../interfaces/FilterParams.md) = [`FilterParams`](../interfaces/FilterParams.md)

#### Parameters

##### path

`string`

##### options?

[`ListOptions`](../interfaces/ListOptions.md)\<`TFilter`, [`PaginatedResponse`](../interfaces/PaginatedResponse.md)\<`T`\>\>

#### Returns

`Promise`\<[`PaginatedResponse`](../interfaces/PaginatedResponse.md)\<`T`\>\>

***

### request()

> **request**\<`T`\>(`path`, `options`): `Promise`\<`T`\>

Defined in: core/ApiClient.ts:500

#### Type Parameters

##### T

`T`

#### Parameters

##### path

`string`

##### options

[`RequestOptions`](../interfaces/RequestOptions.md)\<`T`\> = `{}`

#### Returns

`Promise`\<`T`\>
