import { CognitoJwtVerifier } from '@ttoss/auth-core/amazon-cognito';
import { CreateServerInput, Router, createServer } from 'src/index';
import { schemaComposer } from '../schemaComposer';
import request from 'supertest';

jest.mock('@ttoss/auth-core/amazon-cognito');

const serverOptions: CreateServerInput = {
  schemaComposer,
  graphiql: true,
};

const app = createServer(serverOptions);

const route = new Router();

route.get('/test', (ctx) => {
  ctx.body = 'Test route response';
});

app.use(route.routes());

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

describe('Amazon Cognito Authentication Tests', () => {
  const createAppCognito = () => {
    return createServer({
      schemaComposer,
      graphiql: true,
      authenticationType: 'AMAZON_COGNITO_USER_POOLS',
      userPoolConfig: {
        //userpool sandbox created on cognito aws
        userPoolId: 'us-east-1_ATxbwlLYd',
        clientId: '7vrq50gmsg05vvj0fps84ol5nl',
      },
    });
  };

  const validToken =
    'eyJraWQiOiJsSGpFRElUZ3UxK3k5cno3eThjXC9cL3dDNXZLVEhnRzhwMmswVERNU2N1K2c9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiI2MmNlNDAyZS1jYTZhLTQwYjAtOGE5OC1lYjM2OTYzMWZmZTciLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9BVHhid2xMWWQiLCJ2ZXJzaW9uIjoyLCJjbGllbnRfaWQiOiI3dnJxNTBnbXNnMDV2dmowZnBzODRvbDVubCIsImV2ZW50X2lkIjoiYWRiNDMyNzgtZTQyOC00NjE4LTkzNGQtNGY3OGViZjE2YzE0IiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJhd3MuY29nbml0by5zaWduaW4udXNlci5hZG1pbiBvcGVuaWQgcHJvZmlsZSBlbWFpbCIsImF1dGhfdGltZSI6MTcwNTA3OTc2NCwiZXhwIjoxNzA1MDgzMzY0LCJpYXQiOjE3MDUwNzk3NjQsImp0aSI6IjNmZDBlMDQ0LTJhNDYtNDQ5OC1hMmMyLTIxNzYwMDc1ZmFkZCIsInVzZXJuYW1lIjoiNjJjZTQwMmUtY2E2YS00MGIwLThhOTgtZWIzNjk2MzFmZmU3In0.qZw8Yv401ayaQA_LJP5Bw8dED6vCvD2JwBZ2J1v5ptxA-J2d0Q0AeTC9kmFURtrcj67e0de0q_l2ML6F-fgkVB6GIVDdzWbUV-KS7NKsjEUzV8NvyWUQCfx9Hyi9VWEA7YRDQNdr5ZVYRh615L3joCPa8r7bCaqbDVPw67CSKgxrllsenI-2OPA47SywybtbIdADSi42OIJ_sW3uNaOltMFB61VZuiYKWMFwjaFrNoLb7hfPLXI_LMAbfJtNc6tManvapOprjkvUdrFYIoGL2AHMpP-lYXgmb7jRNCq1bABqWlhvLLnccRTIunO70QAcQOBzfkFb3Xn3rsIWssOwug';
  const invalidToken = 'invalid';

  (CognitoJwtVerifier.create as jest.Mock).mockImplementation(() => {
    return {
      verify: (token: string) => {
        if (token === validToken) {
          return {
            sub: '62ce402e-ca6a-40b0-8a98-eb369631ffe7',
            iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ATxbwlLYd',
            token_use: 'access',
            client_id: '7vrq50gmsg05vvj0fps84ol5nl',
            username: '62ce402e-ca6a-40b0-8a98-eb369631ffe7',
          };
        }
        if (token === invalidToken) {
          throw new Error();
        }
        throw new Error();
      },
    };
  });

  test('should return 401 for unauthorized request with invalid token', async () => {
    const appCognito = createAppCognito();

    expect(CognitoJwtVerifier.create).toHaveBeenCalledWith({
      clientId: '7vrq50gmsg05vvj0fps84ol5nl',
      tokenUse: 'access',
      userPoolId: 'us-east-1_ATxbwlLYd',
    });

    const response = await request(appCognito.callback())
      .post('/graphql')
      .set('Authorization', `Bearer ${invalidToken}`)
      .send({
        query: `
      query{author {
        edges {
          node {
            id
            name
          }
        }
      }}
      `,
      });

    //return 401 because miss the token for authentication
    expect(response.status).toBe(401);
  });

  test('should return 200 for authorized request with valid token', async () => {
    const appCognito = createAppCognito();

    const response = await request(appCognito.callback())
      .post('/graphql')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        query: `
        query{author {
          edges {
            node {
              id
              name
            }
          }
        }}
        `,
      });

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

  test('should return 401 for unauthorized request without token', async () => {
    const appCognito = createAppCognito();

    const response = await request(appCognito.callback())
      .post('/graphql')
      .send({
        query: `
        query{author {
          edges {
            node {
              id
              name
            }
          }
        }}
        `,
      });
    expect(response.status).toBe(401);
  });

  test('should return context identity with valid token', async () => {
    const appCognito = createAppCognito();

    const response = await request(appCognito.callback())
      .post('/graphql')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        query: `
        query{getUser
          {
          sub
          iss
          token_use
          client_id
          username
          }}
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      getUser: {
        client_id: '7vrq50gmsg05vvj0fps84ol5nl',
        iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_ATxbwlLYd',
        sub: '62ce402e-ca6a-40b0-8a98-eb369631ffe7',
        token_use: 'access',
        username: '62ce402e-ca6a-40b0-8a98-eb369631ffe7',
      },
    });
  });

  test('should return 401 with invalid token and getUser query', async () => {
    const appCognito = createAppCognito();

    const response = await request(appCognito.callback())
      .post('/graphql')
      .set('Authorization', `Bearer ${invalidToken}`)
      .send({
        query: `
        query{getUser
          {
          sub
          iss
          token_use
          client_id
          username
          }}
        `,
      });

    expect(response.status).toBe(401);
    expect(response.body.data).toEqual(undefined);
  });
});

test('should export Router', () => {
  expect(Router).toBeDefined();
});

test("should handle '/test' route", async () => {
  const response = await request(app.callback()).get('/test');
  expect(response.status).toBe(200);
  expect(response.text).toBe('Test route response');
});

test('should handle resolvers errors', async () => {
  const query = /* GraphQL */ `
    query {
      getUserWithError {
        sub
      }
    }
  `;

  const response = await request(app.callback())
    .post('/graphql')
    .send({ query });

  expect(response.status).toBe(200);
  expect(response.body.errors).toBeDefined();
  expect(response.body.errors[0].message).toBe('findByIdWithError error');
});
