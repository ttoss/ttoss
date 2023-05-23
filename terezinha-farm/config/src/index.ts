/* eslint-disable turbo/no-undeclared-env-vars */
import { config as dotenv } from 'dotenv';

// Remove string after /config, but keep the /config
const packageRootDir = __dirname.replace(/\/config.*/, '/config');

dotenv({ path: `${packageRootDir}/.env` });

export const config = {
  API_ENDPOINT: process.env.API_ENDPOINT,
  API_KEY: process.env.API_KEY,
  IDENTITY_POOL_ID: process.env.IDENTITY_POOL_ID,
  REGION: process.env.REGION,
  USER_POOL_ID: process.env.USER_POOL_ID,
  APP_CLIENT_ID: process.env.APP_CLIENT_ID,
};
