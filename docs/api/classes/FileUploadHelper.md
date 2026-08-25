[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / FileUploadHelper

# Class: FileUploadHelper

Defined in: helpers/FileUploadHelper.ts:24

## Constructors

### Constructor

> **new FileUploadHelper**(): `FileUploadHelper`

#### Returns

`FileUploadHelper`

## Methods

### uploadFile()

> `static` **uploadFile**(`file`, `endpoint`, `options`): `Promise`\<[`UploadResponse`](../interfaces/UploadResponse.md)\>

Defined in: helpers/FileUploadHelper.ts:67

Upload a file with progress tracking and chunking support

#### Parameters

##### file

`Blob` | `File`

##### endpoint

`string`

##### options

[`FileUploadOptions`](../interfaces/FileUploadOptions.md) = `{}`

#### Returns

`Promise`\<[`UploadResponse`](../interfaces/UploadResponse.md)\>

***

### validateFile()

> `static` **validateFile**(`file`, `options`): `object`

Defined in: helpers/FileUploadHelper.ts:171

Validate file before upload

#### Parameters

##### file

`File`

##### options

###### maxSize?

`number`

###### allowedTypes?

`string`[]

###### allowedExtensions?

`string`[]

#### Returns

`object`

##### valid

> **valid**: `boolean`

##### error?

> `optional` **error**: `string`
