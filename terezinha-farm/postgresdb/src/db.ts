import { initialize } from '@ttoss/postgresdb';

import { models } from '.';

export const db = await initialize({ models });
