import { schemaComposer } from 'graphql-compose';

import { composeWithRelay } from './composeWithRelay';

composeWithRelay(schemaComposer.Query);

export { composeWithRelay };
