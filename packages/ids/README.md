# @ttoss/ids

This package provides a opinionated way to work with different ids in the application.

Check the [blog post](https://ttoss.dev/blog/2024/01/12/working-with-different-ids) for more information.

## Installation

```bash
pnpm add @ttoss/ids
```

## Usage

### From database id to global id

Example with PostgreSQL:

```typescript
import { toRecordId, toGlobalId } from '@ttoss/ids';

const itemFromPostgreSQL = {
  id: 1,
  name: 'John Doe',
};

const recordId = toRecordId(itemFromPostgreSQL.id);

console.log(recordId); // 1

const globalId = toGlobalId('User', recordId);

console.log(globalId); // VXNlcjox
```

Example with DynamoDB:

```typescript
import { toRecordId, toGlobalId } from '@ttoss/ids';

const itemFromDynamoDB = {
  partitionKey: 'USER',
  sortKey: '1',
  name: 'John Doe',
};

const recordId = toRecordId([
  itemFromDynamoDB.partitionKey,
  itemFromDynamoDB.sortKey,
]);

console.log(recordId); // USER:1

const globalId = toGlobalId('User', recordId);

console.log(globalId); // VXNlcjpVU0VSOjE=
```

### From global id to database id

Example with PostgreSQL:

```typescript
import { fromGlobalId, fromRecordId } from '@ttoss/ids';

const globalId = 'VXNlcjox';

const { type, recordId } = fromGlobalId(globalId);

console.log(type); // User
console.log(recordId); // 1

const [databaseId] = fromRecordId(recordId);

console.log(databaseId); // 1
```

Example with DynamoDB:

```typescript
import { fromGlobalId, fromRecordId } from '@ttoss/ids';

const globalId = 'VXNlcjpVU0VSOjE=';

const { type, recordId } = fromGlobalId(globalId);

console.log(type); // User
console.log(recordId); // USER:1

const [partitionKey, sortKey] = fromRecordId(recordId);

console.log(partitionKey); // USER
console.log(sortKey); // 1
```
