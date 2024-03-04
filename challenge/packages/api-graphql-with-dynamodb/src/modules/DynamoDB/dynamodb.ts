/* eslint-disable turbo/no-undeclared-env-vars */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME; // Your DynamoDB table name here.

export { DYNAMODB_TABLE_NAME };

const dynamoDBClient = new DynamoDBClient({});

export const dynamoDBDocumentClient =
  DynamoDBDocumentClient.from(dynamoDBClient);
