import { graphql } from 'graphql';
import { schemaComposer } from '../schemaComposer';

test('should return book', async () => {
  const schema = schemaComposer.buildSchema();

  const source = /* GraphQL */ `
    query ($id: ID!) {
      book(id: $id) {
        id
        title
      }
    }
  `;

  const recordId = '1234';

  const id = Buffer.from('Book:' + recordId).toString('base64');

  const variableValues = { id };

  const response = await graphql({ schema, source, variableValues });

  expect(response).toEqual({
    data: {
      book: {
        id: variableValues.id,
        title: `The Book ${recordId}`,
      },
    },
  });
});

test('should call resolver properly by query', async () => {
  const schema = schemaComposer.buildSchema();

  const source = /* GraphQL */ `
    query ($id: ID!) {
      authorById(id: $id) {
        id
        firstName
        lastName
      }
    }
  `;

  const variableValues = {
    id: '1234',
  };

  const response = await graphql({ schema, source, variableValues });

  expect(response).toEqual({
    data: {
      authorById: {
        id: variableValues.id,
        firstName: 'John',
        lastName: 'Doe',
      },
    },
  });
});

test('should call resolver properly by getResolveMethods', async () => {
  const author = await (
    schemaComposer.getResolveMethods() as any
  ).Query.authorById({}, { id: '234' });

  expect(author).toEqual({
    id: '234',
    firstName: 'John',
    lastName: 'Doe',
  });
});

test('should match schema', () => {
  const sdl = schemaComposer
    .toSDL()
    .replaceAll('\n', ' ')
    .replace(/\s\s+/g, ' ');
  expect(sdl).toContain(
    'type Author { id: ID! firstName: String lastName: String }'
  );
});
