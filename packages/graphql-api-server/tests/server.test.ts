import { CreateServerInput, createServer } from '../src/index';
import { schemaComposer } from './schemaComposer';
import request from 'supertest';

const serverOptions: CreateServerInput = {
  schemaComposer,
  graphiql: true,
};

const app = createServer(serverOptions);

describe('GraphQL Server Tests', () => {
  test('should connect to the server', async () => {
    const response = await request(app.callback()).get('/graphql');
    expect(response.status).toBe(200);
  });

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
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('author');
  });

  test('should execute a sample mutation', async () => {
    const mutation = `
    mutation {
      createAuthor(input: {
        id: "20"
        name: "author 20"
      }) {
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
  });
});
