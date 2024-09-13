# Setup a Strapi CMS in AWS

First, you need to create a new Strapi project Follow the instructions in the [Strapi documentation](https://docs.strapi.io/dev-docs/setup-deployment) to create a new Strapi project.

Create a Dockerfile in the root of your project with the following content:

:::note

For more details about the Dockerfile, check the [Running Strapi in a Docker container documentation](https://docs.strapi.io/dev-docs/installation/docker).

:::

```Dockerfile
# Creating multi-stage build for production
FROM node:20-alpine as build
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev vips-dev git > /dev/null 2>&1
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm install -g node-gyp
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install --only=production
ENV PATH /opt/node_modules/.bin:$PATH
WORKDIR /opt/app
COPY . .
RUN npm run build

# Creating final production image
FROM node:20-alpine
RUN apk add --no-cache vips-dev
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /opt/
COPY --from=build /opt/node_modules ./node_modules
WORKDIR /opt/app
COPY --from=build --chown=node:node /opt/app ./
ENV PATH /opt/node_modules/.bin:$PATH

USER node
EXPOSE 1337
CMD ["npm", "run", "start"]
```

Create a repository in AWS ECR. Follow the instructions in the [Creating an Amazon ECR private repository to store images](https://docs.aws.amazon.com/AmazonECR/latest/userguide/repository-create.html) to create a new repository.

Build the Docker image running the following command:

```bash
docker build \
  --build-arg NODE_ENV=production \
  --build-arg STRAPI_URL=<STRAPI_URL> \
  -t <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/<REPOSITORY_NAME>:<TAG> \
  -f Dockerfile.prod .
```
