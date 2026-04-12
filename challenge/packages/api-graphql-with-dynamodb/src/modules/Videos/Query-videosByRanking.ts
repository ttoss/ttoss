import type { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { schemaComposer } from '@ttoss/graphql-api';
import {
  DYNAMODB_TABLE_NAME,
  dynamoDBDocumentClient,
} from 'src/modules/DynamoDB/dynamodb';

import { VideoTC } from './VideoTC';

VideoTC.addResolver({
  name: 'videosByRanking',
  type: VideoTC.NonNull.List.NonNull,
  description: 'Get videos by ranking.',
  resolve: async () => {
    const params: QueryCommandInput = {
      TableName: DYNAMODB_TABLE_NAME,
      IndexName: 'sk-rating-index',
      KeyConditionExpression: 'sk = :sk',
      ExpressionAttributeValues: {
        ':sk': 'RATING',
      },
      ScanIndexForward: false,
    };

    const command = new QueryCommand(params);

    try {
      const data = await dynamoDBDocumentClient.send(command);

      return data.Items || [];
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      return [];
    }
  },
});

schemaComposer.Query.addFields({
  videosByRanking: VideoTC.getResolver('videosByRanking'),
});
