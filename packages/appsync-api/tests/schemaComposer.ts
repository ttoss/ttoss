import { ResolverResolveParams, schemaComposer } from 'graphql-compose';
import { composeWithRelay } from '../src';

const AuthorTC = schemaComposer.createObjectTC({
  name: 'Author',
  fields: {
    id: 'ID!',
    firstName: 'String',
    lastName: 'String',
  },
});

AuthorTC.addResolver({
  name: 'findById',
  args: { id: 'ID!' },
  type: AuthorTC.NonNull,
  resolve: async ({ args }: ResolverResolveParams<any, any, any>) => {
    return {
      id: args.id,
      firstName: 'John',
      lastName: 'Doe',
    };
  },
});

const BookTC = schemaComposer.createObjectTC({
  name: 'Book',
  fields: {
    id: 'ID!',
    title: 'String',
  },
});

BookTC.setRecordIdFn((source) => {
  return source.id;
});

BookTC.addResolver({
  name: 'findById',
  description: 'Find a book by its ID. Used by node interface.',
  args: { id: 'ID!' },
  type: BookTC.NonNull,
  resolve: async ({ args }: ResolverResolveParams<any, any, any>) => {
    const recordId = args.id;

    return {
      id: recordId,
      __typename: 'Book',
      title: `The Book ${recordId}`,
    };
  },
});

BookTC.addResolver({
  name: 'getBook',
  args: { id: 'ID!' },
  type: BookTC.NonNull,
  resolve: async ({ args, ...rest }: ResolverResolveParams<any, any, any>) => {
    const [, recordId] = Buffer.from(args.id, 'base64').toString().split(':');

    return BookTC.getResolver('findById').resolve({
      ...rest,
      args: {
        ...args,
        id: recordId,
      },
    });
  },
});

composeWithRelay(BookTC);

schemaComposer.Query.addFields({
  authorById: AuthorTC.getResolver('findById'),
  book: BookTC.getResolver('getBook'),
});

export { schemaComposer };
