[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / AppError

# Class: AppError

Defined in: core/ErrorBoundary.ts:27

## Extends

- `Error`

## Extended by

- [`AppValidationError`](AppValidationError.md)
- [`NotFoundError`](NotFoundError.md)
- [`UnauthorizedError`](UnauthorizedError.md)
- [`ForbiddenError`](ForbiddenError.md)
- [`ConflictError`](ConflictError.md)
- [`RateLimitError`](RateLimitError.md)
- [`TimeoutError`](TimeoutError.md)

## Constructors

### Constructor

> **new AppError**(`code`, `message`, `statusCode`, `context?`, `originalError?`): `AppError`

Defined in: core/ErrorBoundary.ts:28

#### Parameters

##### code

`string`

##### message

`string`

##### statusCode

`number` = `500`

##### context?

[`ErrorContext`](../interfaces/ErrorContext.md)

##### originalError?

`Error`

#### Returns

`AppError`

#### Overrides

`Error.constructor`

## Properties

### code

> `readonly` **code**: `string`

Defined in: core/ErrorBoundary.ts:29

***

### statusCode

> `readonly` **statusCode**: `number` = `500`

Defined in: core/ErrorBoundary.ts:31

***

### context?

> `readonly` `optional` **context**: [`ErrorContext`](../interfaces/ErrorContext.md)

Defined in: core/ErrorBoundary.ts:32

***

### originalError?

> `readonly` `optional` **originalError**: `Error`

Defined in: core/ErrorBoundary.ts:33
