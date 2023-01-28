import { ResolverResolveParams, schemaComposer } from 'graphql-compose';

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

test('should match schema', () => {
  const sdl = schemaComposer
    .toSDL()
    .replaceAll('\n', ' ')
    .replace(/\s\s+/g, ' ');
  expect(sdl).toContain('type Query { authorById(id: Int): Author! }');
  expect(sdl).toContain(
    'type Author { id: Int! firstName: String lastName: String }'
  );
});

test('should call resolver properly', async () => {
  const author = await (
    schemaComposer.getResolveMethods() as any
  ).Query.authorById({}, { id: 234 });

  expect(author).toEqual({
    id: 234,
    firstName: 'John',
    lastName: 'Doe',
  });
});
