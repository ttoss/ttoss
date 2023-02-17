import { ResolverResolveParams, schemaComposer } from 'graphql-compose';

test('SDL should not contain empty Mutation or Subscription', () => {
  const AuthorTC = schemaComposer.createObjectTC({
    name: 'Author',
    fields: {
      id: 'Int!',
      firstName: 'String',
      lastName: 'String',
    },
  });

  AuthorTC.addResolver({
    name: 'findById',
    args: { id: 'Int' },
    type: AuthorTC.NonNull,
    resolve: async ({ args }: ResolverResolveParams<any, any, any>) => {
      return {
        id: args.id,
        firstName: 'John',
        lastName: 'Doe',
      };
    },
  });

  schemaComposer.Query.addFields({
    authorById: AuthorTC.getResolver('findById'),
  });

  const sdl = schemaComposer.toSDL();

  expect(sdl).not.toContain('type Mutation');
  expect(sdl).not.toContain('type Subscription');
});
