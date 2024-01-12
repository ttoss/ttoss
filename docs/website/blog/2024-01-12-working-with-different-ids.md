---
title: Working with different ids
description: An entity can have different ids through the application, from database to the frontend.
authors:
  - pedro
tags:
  - graphql
  - database
  - frontend
  - ids
  - global id
  - record id
  - database id
---

An entity can have different ids through the application, from database to the frontend. For example, a user can have an id in the database, another id in the frontend because the [GraphQL Global Object Identification Specification](https://relay.dev/graphql/objectidentification.htm) that Relay specifies. And that is because the concept of node in in a [cursor-based pagination](https://graphql.org/learn/pagination/) that we need to have these different ids.

The concept of node in a GraphQL API is that you can retrieve any data from the database just by knowing the global id of the entity. For example, if you want to retrieve the user with id `1`, you can do it with the following query:

```graphql
query {
  node(id: "VXNlcjox") {
    ... on User {
      id
      name
    }
  }
}
```

The global id is composed by the type of the entity and the id of the entity. In this case, the type is `User` and the id is `1`. The global id is encoded in base64, so the global id is `VXNlcjox` (`base64("User:1")`). The same could be for a post, for example, the global id of the post with id 1 is `UG9zdDox` (`base64("Post:1")`). So these entities have the same id in the database, but different ids in the frontend.

## Many ids

Given this brief introduction, let's see how we can work with these different ids in the application.

### Database id

In the database, we can use the many formats that we want for the ids. For example, we can use the `uuid` type for the ids, or we can use the `int` type for the ids. It depends on the database that we are using and the requirements of the application. Some databases as DynamoDB may require two fields for the ids, one for [the partition key and another for the sort key](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.CoreComponents.html).

As some databases can repeat the ids, the id is not enough to identify an entity through the application.

### Record id

The record id is the id that the database uses to identify the entity. For example, if we are using a relational database, the record id is the primary key of the table. If we are using DynamoDB, the record id is the partition key and the sort key.

For example, if the entity User is on a PostgreSQL database, the record id is the primary key of the table.

```typescript
const getRecordId = (itemFromPostgreSQL) => {
  return itemFromPostgreSQL.id;
};
```

If the entity User is on a DynamoDB database, the record id is the partition key and the sort key.

```typescript
const getRecordId = (itemFromDynamoDB) => {
  return [itemFromDynamoDB.partitionKey, itemFromDynamoDB.sortKey].join(':');
};
```

### Global id

The record id is not enough to identify an entity through the application. We need to use the global id to identify an entity through the application. The global id is composed by the type of the entity and the record id of the entity. For example, if the entity User is on a PostgreSQL database, the global id is `VXNlcjox` (`base64("User:1")`). If the entity User is on a DynamoDB database, the global id is `VXNlcjpVU0VSOjE=` (`base64("User:USER:1")`), in which the partition key is `USER` and the sort key is `1`.

```typescript
const getGlobalId = (itemFromPostgreSQL) => {
  return `User:${itemFromPostgreSQL.id}`;
};

// or

const getGlobalId = (itemFromDynamoDB) => {
  return `User:${itemFromDynamoDB.partitionKey}:${itemFromDynamoDB.sortKey}`;
};
```

Now, we can use the global id to identify an entity through the application, even if the application has many entities with the same database id.

## Considerations

To avoid complexity on the frontend, we can use the global id as the id of the entity on the frontend. It doesn't need to know that some entity has many ids through the application.

You should also be care with the separators that you use to compose the [global id](#global-id) and the [record id](#record-id). The examples of this article use `:` as the separator for both, but you can use any separator that you want. Just be careful to not use a separator that can be used in the ids of the entities. For example, if you use `:` as the separator, you can't use `:` in the ids of the entities.

Also, you have to respect the order from the [global id](#global-id) and the [database id](#database-id). When you split the decoded global id, the first part is the type of the entity and the following part is and array of the record id of the entity, if you use the same separator for both. For example, if you use `:` as the separator, the global id `VXNlcjpVU0VSOjE=` (`base64("User:USER:1")`) is splitted to `["User", "USER", "1"]`. The first part is the type of the entity and the following part is and array of the record id of the entity.

```typescript
const getRecordId = (globalId) => {
  const [type, ...recordId] = globalId.split(':');

  return recordId.join(':');
};
```
