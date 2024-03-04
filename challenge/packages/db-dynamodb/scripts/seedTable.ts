import 'dotenv/config';

import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { videos } from '@ttoss-challenge/seed';

// eslint-disable-next-line turbo/no-undeclared-env-vars
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME as string;

const dynamoDBClient = new DynamoDBClient({});

const dynamoDBDocumentClient = DynamoDBDocumentClient.from(dynamoDBClient);

(async () => {
  const params: BatchWriteCommandInput = {
    RequestItems: {
      [DYNAMODB_TABLE_NAME]: videos.flatMap((video) => {
        const { id, ...videoItem } = video;

        const videoInfoItem = {
          pk: id,
          sk: 'INFO',
          rating: 1200,
          ...videoItem,
        };

        return [
          {
            PutRequest: {
              Item: videoInfoItem,
            },
          },
        ];
      }),
    },
  };

  const command = new BatchWriteCommand(params);

  const data = await dynamoDBDocumentClient.send(command);

  // eslint-disable-next-line no-console
  console.log(data);

  /**
   * Get a single item from the DynamoDB table to verify that the items were
   * inserted correctly.
   */
  const getCommandInput: GetCommandInput = {
    TableName: DYNAMODB_TABLE_NAME,
    Key: {
      pk: videos[0].id,
      sk: 'INFO',
    },
  };

  const getCommand = new GetCommand(getCommandInput);

  const getItem = await dynamoDBDocumentClient.send(getCommand);

  // eslint-disable-next-line no-console
  console.log(getItem);
})();
