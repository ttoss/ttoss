declare module 'graphql-compose-relay' {
  import type { ObjectTypeComposer } from 'graphql-compose';
  export default function composeWithRelay(type: ObjectTypeComposer): void;
}
