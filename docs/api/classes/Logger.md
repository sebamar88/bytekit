[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / Logger

# Class: Logger\<TContext\>

Defined in: core/Logger.ts:124

## Type Parameters

### TContext

`TContext` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Constructors

### Constructor

> **new Logger**\<`TContext`\>(`__namedParameters`): `Logger`\<`TContext`\>

Defined in: core/Logger.ts:131

#### Parameters

##### \_\_namedParameters

[`LoggerOptions`](../interfaces/LoggerOptions.md) = `{}`

#### Returns

`Logger`\<`TContext`\>

## Methods

### setLevel()

> **setLevel**(`level`): `void`

Defined in: core/Logger.ts:151

#### Parameters

##### level

[`LogLevel`](../type-aliases/LogLevel.md)

#### Returns

`void`

***

### child()

> **child**(`namespace`): `Logger`\<`TContext`\>

Defined in: core/Logger.ts:155

#### Parameters

##### namespace

`string`

#### Returns

`Logger`\<`TContext`\>

***

### debug()

> **debug**(`message`, `context?`): `void`

Defined in: core/Logger.ts:166

#### Parameters

##### message

`string`

##### context?

`TContext`

#### Returns

`void`

***

### info()

> **info**(`message`, `context?`): `void`

Defined in: core/Logger.ts:170

#### Parameters

##### message

`string`

##### context?

`TContext`

#### Returns

`void`

***

### warn()

> **warn**(`message`, `context?`): `void`

Defined in: core/Logger.ts:174

#### Parameters

##### message

`string`

##### context?

`TContext`

#### Returns

`void`

***

### error()

> **error**(`message`, `context?`, `error?`): `void`

Defined in: core/Logger.ts:178

#### Parameters

##### message

`string`

##### context?

`TContext`

##### error?

`Error`

#### Returns

`void`

***

### log()

> **log**(`level`, `message`, `context?`, `error?`): `void`

Defined in: core/Logger.ts:182

#### Parameters

##### level

[`LogLevel`](../type-aliases/LogLevel.md)

##### message

`string`

##### context?

`TContext`

##### error?

`Error`

#### Returns

`void`

***

### silent()

> `static` **silent**(): `Logger`\<`Record`\<`string`, `unknown`\>\>

Defined in: core/Logger.ts:206

#### Returns

`Logger`\<`Record`\<`string`, `unknown`\>\>
