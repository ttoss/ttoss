import { initialize } from '@ttoss/postgresdb';

import * as models from './models';

export const db = await initialize({ models });
