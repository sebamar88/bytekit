[**bytekit v1.0.32**](../README.md)

***

[bytekit](../globals.md) / DiffUtils

# Class: DiffUtils

Defined in: helpers/DiffUtils.ts:22

Diff utilities for comparing objects and tracking changes

## Constructors

### Constructor

> **new DiffUtils**(): `DiffUtils`

#### Returns

`DiffUtils`

## Methods

### deepEqual()

> `static` **deepEqual**(`a`, `b`): `boolean`

Defined in: helpers/DiffUtils.ts:26

Deep compare two values

#### Parameters

##### a

`unknown`

##### b

`unknown`

#### Returns

`boolean`

***

### diff()

> `static` **diff**(`oldObj`, `newObj`): [`DiffResult`](../interfaces/DiffResult.md)

Defined in: helpers/DiffUtils.ts:58

Diff two objects and return changed, added, removed keys

#### Parameters

##### oldObj

`Record`\<`string`, `unknown`\>

##### newObj

`Record`\<`string`, `unknown`\>

#### Returns

[`DiffResult`](../interfaces/DiffResult.md)

***

### createPatch()

> `static` **createPatch**(`oldObj`, `newObj`): [`Patch`](../interfaces/Patch.md)[]

Defined in: helpers/DiffUtils.ts:91

Create patches from old to new object

#### Parameters

##### oldObj

`Record`\<`string`, `unknown`\>

##### newObj

`Record`\<`string`, `unknown`\>

#### Returns

[`Patch`](../interfaces/Patch.md)[]

***

### applyPatch()

> `static` **applyPatch**(`obj`, `patches`): `Record`\<`string`, `unknown`\>

Defined in: helpers/DiffUtils.ts:132

Apply patches to object

#### Parameters

##### obj

`Record`\<`string`, `unknown`\>

##### patches

[`Patch`](../interfaces/Patch.md)[]

#### Returns

`Record`\<`string`, `unknown`\>

***

### reversePatch()

> `static` **reversePatch**(`patches`): [`Patch`](../interfaces/Patch.md)[]

Defined in: helpers/DiffUtils.ts:158

Reverse patches (undo)

#### Parameters

##### patches

[`Patch`](../interfaces/Patch.md)[]

#### Returns

[`Patch`](../interfaces/Patch.md)[]

***

### deepDiff()

> `static` **deepDiff**(`oldObj`, `newObj`, `prefix`): [`DiffResult`](../interfaces/DiffResult.md)

Defined in: helpers/DiffUtils.ts:219

Deep diff with nested paths

#### Parameters

##### oldObj

`unknown`

##### newObj

`unknown`

##### prefix

`string` = `""`

#### Returns

[`DiffResult`](../interfaces/DiffResult.md)

***

### merge()

> `static` **merge**(`obj1`, `obj2`, `strategy`): `Record`\<`string`, `unknown`\>

Defined in: helpers/DiffUtils.ts:274

Merge two objects with conflict resolution

#### Parameters

##### obj1

`Record`\<`string`, `unknown`\>

##### obj2

`Record`\<`string`, `unknown`\>

##### strategy

`"first"` | `"second"` | `"merge"`

#### Returns

`Record`\<`string`, `unknown`\>

***

### getSummary()

> `static` **getSummary**(`diff`): `string`

Defined in: helpers/DiffUtils.ts:309

Get summary of changes

#### Parameters

##### diff

[`DiffResult`](../interfaces/DiffResult.md)

#### Returns

`string`
