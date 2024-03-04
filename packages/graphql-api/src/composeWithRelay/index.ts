import { composeWithRelay } from './composeWithRelay';
import { schemaComposer } from 'graphql-compose';

composeWithRelay(schemaComposer.Query);

export { composeWithRelay };
