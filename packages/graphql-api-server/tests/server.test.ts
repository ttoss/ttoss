import { CreateServerInput, createServer } from '../src/index';
import { schemaComposer } from '../src/schemaComposer';
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
    query{farms {
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
    expect(response.body.data).toHaveProperty('farms');
  });

  test('should execute a sample mutation', async () => {
    const mutation = `
    mutation {
      createFarmId(input: {
        id: "20"
        name: "fazenda da tereza"
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
