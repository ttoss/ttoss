import { allow, deny, shield } from 'graphql-shield';
import { buildSchema } from '../../src';
import { graphql } from 'graphql';
import { schemaComposer } from '../schemaComposer';

let authorsResponse: any;

beforeAll(async () => {
  authorsResponse = await graphql({
    schema: schemaComposer.buildSchema(),
    source: /* GraphQL */ `
      query {
        authors {
          edges {
            cursor
            node {
              id
              name
            }
          }
        }
      }
    `,
  });
});

const permissionError = new Error('Test Not allowed');

test.each([
  shield(
    {
      Query: {
        '*': deny,
      },
    },
    {
      fallbackRule: deny,
      fallbackError: permissionError,
    }
  ),
  shield(
    {
      Query: {
        '*': deny,
      },
    },
    {
      fallbackRule: allow,
      fallbackError: permissionError,
    }
  ),
  shield(
    {
      Query: {
        author: deny,
      },
    },
    {
      fallbackRule: allow,
      fallbackError: permissionError,
    }
  ),
])('should NOT query author %#', async (permissions) => {
  const author = authorsResponse.data.authors.edges[0].node;

  const { errors } = await graphql({
    schema: buildSchema({
      schemaComposer,
      middlewares: [permissions],
    }),
    source: /* GraphQL */ `
      query ($id: ID!) {
        author(id: $id) {
          id
          name
        }
      }
    `,
    variableValues: {
      id: author.id,
    },
  });

  expect(errors).toEqual([permissionError]);
});

test.each([
  shield(
    {
      Query: {
        author: allow,
      },
    },
    {
      fallbackRule: allow,
    }
  ),
  shield({
    Query: {
      author: allow,
    },
  }),
  shield(
    {
      Query: {
        '*': deny,
        author: allow,
      },
      Author: {
        id: allow,
        name: allow,
      },
    },
    {
      fallbackRule: deny,
    }
  ),
  shield(
    {
      Query: {
        '*': deny,
        author: allow,
      },
      Author: {
        '*': allow,
      },
    },
    {
      fallbackRule: deny,
    }
  ),
])('should query author %#', async (permissions) => {
  const author = authorsResponse.data.authors.edges[0].node;

  const response = await graphql({
    schema: buildSchema({
      schemaComposer,
      middlewares: [permissions],
    }),
    source: /* GraphQL */ `
      query ($id: ID!) {
        author(id: $id) {
          id
          name
        }
      }
    `,
    variableValues: {
      id: author.id,
    },
  });

  expect(response).toEqual({
    data: {
      author: {
        id: author.id,
        name: author.name,
      },
    },
  });
});
