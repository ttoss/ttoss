import { schemaComposer } from '@ttoss/graphql-api';

const AuthorTC = schemaComposer.createObjectTC({
  name: 'Author',
  fields: {
    id: 'Int!',
    name: 'String!',
  },
});

AuthorTC.addResolver({
  name: 'findById',
  type: AuthorTC,
  args: { id: 'Int!' },
  resolve: () => {
    return { id: 2, name: 'Author' };
  },
});

schemaComposer.Query.addFields({
  authorById: AuthorTC.getResolver('findById'),
});

export { schemaComposer };
