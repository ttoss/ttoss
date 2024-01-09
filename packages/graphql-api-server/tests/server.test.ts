import { CreateServerInput, createServer } from '../src/index';
import { schemaComposer } from './schemaComposer';
import request from 'supertest';

const serverOptions: CreateServerInput = {
  schemaComposer,
  graphiql: true,
};

const app = createServer(serverOptions);

describe('GraphQL Server Tests', () => {
  test('should execute a sample query', async () => {
    const query = `
    query{author {
      edges {
        node {
          id
          name
        }
      }
    }}
    `;

    const response = await request(app.callback())
      .post('/graphql') // Replace with your GraphQL endpoint
      .send({ query });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      author: {
        edges: [
          { node: { id: 1, name: 'Author 1' } },
          { node: { id: 2, name: 'Author 2' } },
          { node: { id: 3, name: 'Author 3' } },
          { node: { id: 4, name: 'Author 4' } },
          { node: { id: 5, name: 'Author 5' } },
          { node: { id: 6, name: 'Author 6' } },
          { node: { id: 7, name: 'Author 7' } },
          { node: { id: 8, name: 'Author 8' } },
          { node: { id: 9, name: 'Author 9' } },
          { node: { id: 10, name: 'Author 10' } },
        ],
      },
    });
  });

  test('should execute a sample mutation', async () => {
    const mutation = `
    mutation {
      createAuthor(id: "100", name: "author 100"){
        id
        name
      }
    }
    `;

    const response = await request(app.callback())
      .post('/graphql') // Replace with your GraphQL endpoint
      .send({ query: mutation });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('createAuthor');
    expect(response.body.data.createAuthor).toEqual({
      id: 100,
      name: 'author 100',
    });
  });
});
