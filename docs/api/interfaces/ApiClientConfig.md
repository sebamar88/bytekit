[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ApiClientConfig

# Interface: ApiClientConfig

Defined in: core/ApiClient.ts:31

## Properties

### baseUrl?

> `optional` **baseUrl**: `string`

Defined in: core/ApiClient.ts:32

***

### baseURL?

> `optional` **baseURL**: `string`

Defined in: core/ApiClient.ts:33

***

### defaultHeaders?

> `optional` **defaultHeaders**: `HeadersInit`

Defined in: core/ApiClient.ts:34

***

### fetchImpl()?

> `optional` **fetchImpl**: \{(`input`, `init?`): `Promise`\<`Response`\>; (`input`, `init?`): `Promise`\<`Response`\>; \}

Defined in: core/ApiClient.ts:35

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`URL` | `RequestInfo`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

#### Call Signature

> (`input`, `init?`): `Promise`\<`Response`\>

[MDN Reference](https://developer.mozilla.org/docs/Web/API/Window/fetch)

##### Parameters

###### input

`string` | `URL` | `Request`

###### init?

`RequestInit`

##### Returns

`Promise`\<`Response`\>

***

### locale?

> `optional` **locale**: [`Locale`](../type-aliases/Locale.md)

Defined in: core/ApiClient.ts:36

***

### errorMessages?

> `optional` **errorMessages**: `Partial`\<`Record`\<[`Locale`](../type-aliases/Locale.md), `Partial`\<`Record`\<`number`, `string`\>\>\>\>

Defined in: core/ApiClient.ts:37

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: core/ApiClient.ts:38

***

### interceptors?

> `optional` **interceptors**: [`ApiClientInterceptors`](ApiClientInterceptors.md)

Defined in: core/ApiClient.ts:39

***

### disableInterceptors?

> `optional` **disableInterceptors**: `boolean`

Defined in: core/ApiClient.ts:40

***

### logHeaders?

> `optional` **logHeaders**: `boolean`

Defined in: core/ApiClient.ts:41

***

### redactHeaderKeys?

> `optional` **redactHeaderKeys**: `string`[]

Defined in: core/ApiClient.ts:42

***

### logger?

> `optional` **logger**: [`Logger`](../classes/Logger.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: core/ApiClient.ts:43

***

### retryPolicy?

> `optional` **retryPolicy**: [`RetryConfig`](RetryConfig.md)

Defined in: core/ApiClient.ts:44

***

### circuitBreaker?

> `optional` **circuitBreaker**: [`CircuitBreakerConfig`](CircuitBreakerConfig.md)

Defined in: core/ApiClient.ts:45
