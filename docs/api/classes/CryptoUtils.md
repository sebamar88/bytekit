[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / CryptoUtils

# Class: CryptoUtils

Defined in: helpers/CryptoUtils.ts:11

Crypto utilities

## Constructors

### Constructor

> **new CryptoUtils**(): `CryptoUtils`

#### Returns

`CryptoUtils`

## Methods

### generateToken()

> `static` **generateToken**(`length`): `string`

Defined in: helpers/CryptoUtils.ts:19

Generate cryptographically secure random token (hex string)

#### Parameters

##### length

`number` = `32`

Length of the token in bytes (default: 32)

#### Returns

`string`

Hex-encoded random string

#### Security

Uses crypto.getRandomValues() for secure random generation

#### Throws

If crypto API is unavailable

***

### generateUUID()

> `static` **generateUUID**(): `string`

Defined in: helpers/CryptoUtils.ts:39

Generate cryptographically secure UUID v4

#### Returns

`string`

UUID v4 string in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx

#### Security

Uses crypto.randomUUID() when available

#### Throws

If crypto API is unavailable

***

### base64Encode()

> `static` **base64Encode**(`str`): `string`

Defined in: helpers/CryptoUtils.ts:73

Base64 encode

#### Parameters

##### str

`string`

#### Returns

`string`

***

### base64Decode()

> `static` **base64Decode**(`str`): `string`

Defined in: helpers/CryptoUtils.ts:90

Base64 decode

#### Parameters

##### str

`string`

#### Returns

`string`

***

### base64UrlEncode()

> `static` **base64UrlEncode**(`str`): `string`

Defined in: helpers/CryptoUtils.ts:108

URL-safe base64 encode

#### Parameters

##### str

`string`

#### Returns

`string`

***

### base64UrlDecode()

> `static` **base64UrlDecode**(`str`): `string`

Defined in: helpers/CryptoUtils.ts:118

URL-safe base64 decode

#### Parameters

##### str

`string`

#### Returns

`string`

***

### simpleHash()

> `static` **simpleHash**(`str`): `string`

Defined in: helpers/CryptoUtils.ts:129

Simple hash using string manipulation (not cryptographic)
For actual hashing, use SubtleCrypto or Node.js crypto

#### Parameters

##### str

`string`

#### Returns

`string`

***

### hash()

> `static` **hash**(`str`, `algorithm`): `Promise`\<`string`\>

Defined in: helpers/CryptoUtils.ts:142

Hash string using SubtleCrypto (browser) or crypto (Node.js)

#### Parameters

##### str

`string`

##### algorithm

`"SHA-1"` | `"SHA-256"` | `"SHA-384"` | `"SHA-512"`

#### Returns

`Promise`\<`string`\>

***

### hmac()

> `static` **hmac**(`message`, `secret`, `algorithm`): `Promise`\<`string`\>

Defined in: helpers/CryptoUtils.ts:181

Create HMAC signature

#### Parameters

##### message

`string`

##### secret

`string`

##### algorithm

`"SHA-256"` | `"SHA-512"`

#### Returns

`Promise`\<`string`\>

***

### verifyHash()

> `static` **verifyHash**(`str`, `hash`, `algorithm`): `Promise`\<`boolean`\>

Defined in: helpers/CryptoUtils.ts:228

Check if string matches hash

#### Parameters

##### str

`string`

##### hash

`string`

##### algorithm

`"SHA-1"` | `"SHA-256"` | `"SHA-384"` | `"SHA-512"`

#### Returns

`Promise`\<`boolean`\>

***

### ~~xorEncrypt()~~

> `static` **xorEncrypt**(`str`, `key`): `string`

Defined in: helpers/CryptoUtils.ts:242

Encrypt string (simple XOR - NOT for production)
For production, use proper encryption libraries like TweetNaCl or libsodium

#### Parameters

##### str

`string`

##### key

`string`

#### Returns

`string`

#### Deprecated

XOR encryption is NOT cryptographically secure. Use proper encryption libraries.

***

### ~~xorDecrypt()~~

> `static` **xorDecrypt**(`encrypted`, `key`): `string`

Defined in: helpers/CryptoUtils.ts:259

Decrypt string (simple XOR - NOT for production)

#### Parameters

##### encrypted

`string`

##### key

`string`

#### Returns

`string`

#### Deprecated

XOR encryption is NOT cryptographically secure. Use proper encryption libraries.

***

### randomBytes()

> `static` **randomBytes**(`length`): `Uint8Array`

Defined in: helpers/CryptoUtils.ts:276

Generate random bytes

#### Parameters

##### length

`number`

#### Returns

`Uint8Array`

***

### constantTimeCompare()

> `static` **constantTimeCompare**(`a`, `b`): `boolean`

Defined in: helpers/CryptoUtils.ts:291

Constant-time string comparison (prevents timing attacks)

#### Parameters

##### a

`string`

##### b

`string`

#### Returns

`boolean`
