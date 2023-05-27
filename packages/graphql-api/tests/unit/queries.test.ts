import { AUTHORS, BOOKS, schemaComposer } from '../schemaComposer';
import { buildSchema } from '../../src';
import { graphql } from 'graphql';

describe('authors query', () => {
  let authorsResponse: any;

  beforeAll(async () => {
    authorsResponse = await graphql({
      schema: buildSchema({ schemaComposer }),
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

  test('should match authors names', () => {
    const authorsNames = AUTHORS.map((author) => {
      return author.name;
    });

    const authorsResponseNames = authorsResponse.data.authors.edges.map(
      (edge: any) => {
        return edge.node.name;
      }
    );

    expect(authorsNames).toEqual(authorsResponseNames);
  });

  test('should query author', async () => {
    const author = authorsResponse.data.authors.edges[0].node;

    const response = await graphql({
      schema: buildSchema({ schemaComposer }),
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

  test('should query authors by id using node', async () => {
    const author = authorsResponse.data.authors.edges[0].node;

    const response = await graphql({
      schema: schemaComposer.buildSchema(),
      source: /* GraphQL */ `
        query ($id: ID!) {
          node(id: $id) {
            id
            ... on Author {
              name
            }
          }
        }
      `,
      variableValues: {
        id: author.id,
      },
    });

    expect(response).toEqual({
      data: {
        node: {
          id: author.id,
          name: author.name,
        },
      },
    });
  });
});

describe('books query', () => {
  let booksResponse: any;

  beforeAll(async () => {
    booksResponse = await graphql({
      schema: schemaComposer.buildSchema(),
      source: /* GraphQL */ `
        query {
          books {
            edges {
              cursor
              node {
                id
                title
                authorId
                author {
                  id
                  name
                }
              }
            }
          }
        }
      `,
    });
  });

  test('should match books titles', () => {
    const booksTitles = BOOKS.map((book) => {
      return book.title;
    });

    const booksResponseTitles = booksResponse.data.books.edges.map(
      (edge: any) => {
        return edge.node.title;
      }
    );

    expect(booksTitles).toEqual(booksResponseTitles);
  });

  test('should query book', async () => {
    const book = booksResponse.data.books.edges[0].node;

    const response = await graphql({
      schema: schemaComposer.buildSchema(),
      source: /* GraphQL */ `
        query ($id: ID!) {
          book(id: $id) {
            id
            title
          }
        }
      `,
      variableValues: {
        id: book.id,
      },
    });

    expect(response).toEqual({
      data: {
        book: {
          id: book.id,
          title: book.title,
        },
      },
    });
  });

  test('should query books by id using node', async () => {
    const book = booksResponse.data.books.edges[0].node;

    const response = await graphql({
      schema: schemaComposer.buildSchema(),
      source: /* GraphQL */ `
        query ($id: ID!) {
          node(id: $id) {
            id
            ... on Book {
              title
            }
          }
        }
      `,
      variableValues: {
        id: book.id,
      },
    });

    expect(response).toEqual({
      data: {
        node: {
          id: book.id,
          title: book.title,
        },
      },
    });
  });

  test('should query author of book', async () => {
    const book = booksResponse.data.books.edges[0].node;

    const response = await graphql({
      schema: schemaComposer.buildSchema(),
      source: /* GraphQL */ `
        query ($id: ID!) {
          book(id: $id) {
            id
            title
            authorId
            author {
              id
              name
            }
          }
        }
      `,
      variableValues: {
        id: book.id,
      },
    });

    expect(response).toEqual({
      data: {
        book: {
          id: book.id,
          title: book.title,
          authorId: book.authorId,
          author: {
            id: book.author.id,
            name: book.author.name,
          },
        },
      },
    });
  });
});
