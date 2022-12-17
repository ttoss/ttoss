/* eslint-disable turbo/no-undeclared-env-vars */
import { config as dotenv } from 'dotenv';
import workspaceRoot from 'find-yarn-workspace-root';

const rootDirectory = workspaceRoot();

dotenv({ path: `${rootDirectory}/terezinha-farm/config/.env` });

export const config = {
  apiEndpoint: process.env.API_ENDPOINT,
  apiKey: process.env.API_KEY,
};
