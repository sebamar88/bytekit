[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / CompressionUtils

# Class: CompressionUtils

Defined in: helpers/CompressionUtils.ts:9

Compression utilities

## Constructors

### Constructor

> **new CompressionUtils**(): `CompressionUtils`

#### Returns

`CompressionUtils`

## Methods

### compress()

> `static` **compress**(`str`): `string`

Defined in: helpers/CompressionUtils.ts:14

Compress string using LZ-like algorithm (simple)
For production, use proper compression libraries

#### Parameters

##### str

`string`

#### Returns

`string`

***

### decompress()

> `static` **decompress**(`compressed`): `string`

Defined in: helpers/CompressionUtils.ts:37

Decompress string

#### Parameters

##### compressed

`string`

#### Returns

`string`

***

### base64Encode()

> `static` **base64Encode**(`str`): `string`

Defined in: helpers/CompressionUtils.ts:66

Base64 encode

#### Parameters

##### str

`string`

#### Returns

`string`

***

### base64Decode()

> `static` **base64Decode**(`str`): `string`

Defined in: helpers/CompressionUtils.ts:77

Base64 decode

#### Parameters

##### str

`string`

#### Returns

`string`

***

### base64UrlEncode()

> `static` **base64UrlEncode**(`str`): `string`

Defined in: helpers/CompressionUtils.ts:88

URL-safe base64 encode

#### Parameters

##### str

`string`

#### Returns

`string`

***

### base64UrlDecode()

> `static` **base64UrlDecode**(`str`): `string`

Defined in: helpers/CompressionUtils.ts:98

URL-safe base64 decode

#### Parameters

##### str

`string`

#### Returns

`string`

***

### serializeCompressed()

> `static` **serializeCompressed**(`obj`): `string`

Defined in: helpers/CompressionUtils.ts:108

Serialize object to compressed JSON

#### Parameters

##### obj

`unknown`

#### Returns

`string`

***

### deserializeCompressed()

> `static` **deserializeCompressed**(`compressed`): `unknown`

Defined in: helpers/CompressionUtils.ts:116

Deserialize compressed JSON

#### Parameters

##### compressed

`string`

#### Returns

`unknown`

***

### getCompressionRatio()

> `static` **getCompressionRatio**(`original`, `compressed`): `number`

Defined in: helpers/CompressionUtils.ts:125

Calculate compression ratio (0-100, where 100 is best compression)
Returns 0 if compressed is larger than original

#### Parameters

##### original

`string`

##### compressed

`string`

#### Returns

`number`

***

### minifyJSON()

> `static` **minifyJSON**(`json`): `string`

Defined in: helpers/CompressionUtils.ts:133

Minify JSON (remove whitespace)

#### Parameters

##### json

`string`

#### Returns

`string`

***

### prettyJSON()

> `static` **prettyJSON**(`json`, `indent`): `string`

Defined in: helpers/CompressionUtils.ts:140

Pretty print JSON

#### Parameters

##### json

`string`

##### indent

`number` = `2`

#### Returns

`string`

***

### gzip()

> `static` **gzip**(`str`): `Promise`\<`string` \| `Buffer`\<`ArrayBufferLike`\>\>

Defined in: helpers/CompressionUtils.ts:152

Gzip compress (Node.js only)

#### Parameters

##### str

`string`

#### Returns

`Promise`\<`string` \| `Buffer`\<`ArrayBufferLike`\>\>

***

### gunzip()

> `static` **gunzip**(`data`): `Promise`\<`string`\>

Defined in: helpers/CompressionUtils.ts:172

Gzip decompress (Node.js only)

#### Parameters

##### data

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`string`\>

***

### deflate()

> `static` **deflate**(`str`): `Promise`\<`string` \| `Buffer`\<`ArrayBufferLike`\>\>

Defined in: helpers/CompressionUtils.ts:199

Deflate compress (Node.js only)

#### Parameters

##### str

`string`

#### Returns

`Promise`\<`string` \| `Buffer`\<`ArrayBufferLike`\>\>

***

### inflate()

> `static` **inflate**(`data`): `Promise`\<`string`\>

Defined in: helpers/CompressionUtils.ts:218

Inflate decompress (Node.js only)

#### Parameters

##### data

`string` | `Buffer`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`string`\>

***

### getSize()

> `static` **getSize**(`str`): `number`

Defined in: helpers/CompressionUtils.ts:244

Get size in bytes

#### Parameters

##### str

`string`

#### Returns

`number`

***

### formatBytes()

> `static` **formatBytes**(`bytes`, `decimals`): `string`

Defined in: helpers/CompressionUtils.ts:255

Format bytes to human readable

#### Parameters

##### bytes

`number`

##### decimals

`number` = `2`

#### Returns

`string`
