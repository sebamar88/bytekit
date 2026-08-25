[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / PollingResult

# Interface: PollingResult\<T\>

Defined in: helpers/PollingHelper.ts:26

## Type Parameters

### T

`T` = `unknown`

## Properties

### success

> **success**: `boolean`

Defined in: helpers/PollingHelper.ts:27

***

### result?

> `optional` **result**: `T`

Defined in: helpers/PollingHelper.ts:28

***

### error?

> `optional` **error**: `Error`

Defined in: helpers/PollingHelper.ts:29

***

### attempts

> **attempts**: `number`

Defined in: helpers/PollingHelper.ts:30

***

### duration

> **duration**: `number`

Defined in: helpers/PollingHelper.ts:31

***

### metrics?

> `optional` **metrics**: `object`

Defined in: helpers/PollingHelper.ts:33

Performance metrics for successful attempts

#### minResponseTime

> **minResponseTime**: `number`

#### maxResponseTime

> **maxResponseTime**: `number`

#### avgResponseTime

> **avgResponseTime**: `number`
