# ttoss Challenge - App Vite with GraphQL API

This is a challenge to create a Vite app with a GraphQL API. This project has an initial setup with Vite and a GraphQL API, but it's not working. Your task is to make it work.

![App with initial setup](./images/app-example.png)

## Getting Started

Install the dependencies:

```bash
pnpm install
```

Build Relay artifacts:

```bash
pnpm relay
```

Run in development mode:

```bash
pnpm dev
```

## Tasks

Some tasks you can do to complete this challenge:

- [ ] Connect with your GraphQL API (_file: [src/relay/environment.ts](./src/relay/environment.ts)_)
- [ ] Create an engine to handle videos voting (_reference: [Mutations & Updates](https://relay.dev/docs/tutorial/mutations-updates/)_)
- [ ] Show the list of videos sorted by ranking (_reference: [Query Basics](https://relay.dev/docs/tutorial/queries-1/)_)
