/* eslint-disable turbo/no-undeclared-env-vars */
import { config as dotenv } from 'dotenv';
import workspaceRoot from 'find-yarn-workspace-root';

const rootDirectory = workspaceRoot();

dotenv({ path: `${rootDirectory}/terezinha-farm/config/.env` });

export const config = {
  API_ENDPOINT: process.env.API_ENDPOINT,
  API_KEY: process.env.API_KEY,
  IDENTITY_POOL_ID: process.env.IDENTITY_POOL_ID,
  REGION: process.env.REGION,
  USER_POOL_ID: process.env.USER_POOL_ID,
  APP_CLIENT_ID: process.env.APP_CLIENT_ID,
};
