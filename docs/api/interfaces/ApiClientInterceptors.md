[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ApiClientInterceptors

# Interface: ApiClientInterceptors

Defined in: core/ApiClient.ts:23

## Properties

### request()?

> `optional` **request**: (`url`, `init`) => \[`string`, `RequestInit`\] \| `Promise`\<\[`string`, `RequestInit`\]\>

Defined in: core/ApiClient.ts:24

#### Parameters

##### url

`string`

##### init

`RequestInit`

#### Returns

\[`string`, `RequestInit`\] \| `Promise`\<\[`string`, `RequestInit`\]\>

***

### response()?

> `optional` **response**: (`response`) => `Response` \| `Promise`\<`Response`\>

Defined in: core/ApiClient.ts:28

#### Parameters

##### response

`Response`

#### Returns

`Response` \| `Promise`\<`Response`\>
