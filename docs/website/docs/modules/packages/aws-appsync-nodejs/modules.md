---
id: 'modules'
title: '@ttoss/aws-appsync-nodejs'
sidebar_label: 'Exports'
sidebar_position: 0.5
custom_edit_url: null
---

## Type Aliases

### Config

Ƭ **Config**: `Object`

#### Type declaration

| Name              | Type     |
| :---------------- | :------- |
| `apiEndpoint`     | `string` |
| `apiKey?`         | `string` |
| `awsCredentials?` | `any`    |

#### Defined in

[index.ts:7](https://github.com/ttoss/ttoss/blob/88b9894/packages/aws-appsync-nodejs/src/index.ts#L7)

---

### Query

Ƭ **Query**: (`query`: `string`, `variables`: `Record`<`string`, `unknown`\>) => `Promise`<{ `data`: `Record`<`string`, `unknown`\> \| `null` ; `errors?`: { `locations`: `any`[] ; `message`: `string` ; `path`: `string` \| `null` }[] }\>

#### Type declaration

▸ (`query`, `variables`): `Promise`<{ `data`: `Record`<`string`, `unknown`\> \| `null` ; `errors?`: { `locations`: `any`[] ; `message`: `string` ; `path`: `string` \| `null` }[] }\>

##### Parameters

| Name        | Type                           |
| :---------- | :----------------------------- |
| `query`     | `string`                       |
| `variables` | `Record`<`string`, `unknown`\> |

##### Returns

`Promise`<{ `data`: `Record`<`string`, `unknown`\> \| `null` ; `errors?`: { `locations`: `any`[] ; `message`: `string` ; `path`: `string` \| `null` }[] }\>

#### Defined in

[index.ts:19](https://github.com/ttoss/ttoss/blob/88b9894/packages/aws-appsync-nodejs/src/index.ts#L19)

## Variables

### appSyncClient

• `Const` **appSyncClient**: `Object`

#### Type declaration

| Name           | Type                                                |
| :------------- | :-------------------------------------------------- |
| `query`        | [`Query`](modules.md#query)                         |
| `setConfig`    | (`config`: [`Config`](modules.md#config)) => `void` |
| `get config()` | [`Config`](modules.md#config)                       |

#### Defined in

[index.ts:67](https://github.com/ttoss/ttoss/blob/88b9894/packages/aws-appsync-nodejs/src/index.ts#L67)
