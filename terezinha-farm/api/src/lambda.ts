import { appSyncResolverHandler } from '@ttoss/appsync-api';
import { schemaComposer } from './schemaComposer';

export const handler = appSyncResolverHandler({ schemaComposer });
