[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / createPoller

# Function: createPoller()

> **createPoller**\<`T`\>(`fn`, `options?`): [`PollingHelper`](../classes/PollingHelper.md)\<`T`\>

Defined in: helpers/PollingHelper.ts:394

Factory function for creating pollers

## Type Parameters

### T

`T` = `unknown`

## Parameters

### fn

() => `Promise`\<`T`\>

### options?

[`PollingOptions`](../interfaces/PollingOptions.md)\<`T`\>

## Returns

[`PollingHelper`](../classes/PollingHelper.md)\<`T`\>
