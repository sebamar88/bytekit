[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / ConflictError

# Class: ConflictError

Defined in: core/ErrorBoundary.ts:68

## Extends

- [`AppError`](AppError.md)

## Constructors

### Constructor

> **new ConflictError**(`message`, `context?`): `ConflictError`

Defined in: core/ErrorBoundary.ts:69

#### Parameters

##### message

`string`

##### context?

[`ErrorContext`](../interfaces/ErrorContext.md)

#### Returns

`ConflictError`

#### Overrides

[`AppError`](AppError.md).[`constructor`](AppError.md#constructor)

## Properties

### code

> `readonly` **code**: `string`

Defined in: core/ErrorBoundary.ts:29

#### Inherited from

[`AppError`](AppError.md).[`code`](AppError.md#code)

***

### statusCode

> `readonly` **statusCode**: `number` = `500`

Defined in: core/ErrorBoundary.ts:31

#### Inherited from

[`AppError`](AppError.md).[`statusCode`](AppError.md#statuscode)

***

### context?

> `readonly` `optional` **context**: [`ErrorContext`](../interfaces/ErrorContext.md)

Defined in: core/ErrorBoundary.ts:32

#### Inherited from

[`AppError`](AppError.md).[`context`](AppError.md#context)

***

### originalError?

> `readonly` `optional` **originalError**: `Error`

Defined in: core/ErrorBoundary.ts:33

#### Inherited from

[`AppError`](AppError.md).[`originalError`](AppError.md#originalerror)
