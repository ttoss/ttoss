import 'dotenv/config';

import { db } from '../src/db';
import { videos } from '@ttoss-challenge/seed';

const result = await db.Videos.bulkCreate(videos);

// eslint-disable-next-line no-console
console.info(`Inserted ${result.length} videos`, result);
