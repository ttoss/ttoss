import * as models from './models';
import { initialize } from '@ttoss/postgresdb';

export const db = await initialize({ models });
