# ttoss Challenge - Engineering

Given [the project The Best YouTube Video of All Time](https://ttoss.dev/docs/challenge/the-project), the engineering challenge consists of building a web application from database architecture, API design, front-end development and deployment.

## Requirements

A characteristic of this challenge is that it is open-ended. We'll provide the requirements and the main features that the application should have, but you have the freedom to choose the technologies and tools that you think are best for the project, except when we specify them.

### Database

The database should store the information about the videos and their ranking. You can use:

- Use a DynamoDB table with [single-table design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/) ([_initial example provided here_](https://github.com/ttoss/ttoss/tree/main/challenge/packages/db-dynamodb)).
- Use a PostgreSQL database with a schema that you think is best for the project.
- Any other database that you think is best for the project.

### API

The API should provide at least the following resources:

- Get a list of videos sorted by their ranking.
- Get two videos for the user to vote.
- A mutation to register the user's vote and update the ranking.
- Any other resource that you think is best for the project.

You can implement the API using REST or GraphQL ([_initial example provided here_](https://github.com/ttoss/ttoss/tree/main/challenge/packages/api-graphql-with-dynamodb)), but it should use Node.js.

### Front-end

The front-end should have at least the following features:

- A section to show two videos for the user to vote.
- A section to show the ranking of the videos.
- Any other feature that you think is best for the project.

You need to use React to build the front-end. We have a [boilerplate using Vite.js and consuming a GraphQL API](https://github.com/ttoss/ttoss/tree/main/challenge/packages/app-vite-with-graphql-api). You can use it as a starting point or build the front-end from scratch.

### Deployment

The application should be deployed as a serverless application on AWS or in a virtual machine.

## We can provide you with:

During this challenge, we can provide you with the following resources:

- A DynamoDB table.
- A PostgreSQL database.
- An AWS account.
- A virtual machine.
- Mentorship from our team to help you with the challenge.

## Evaluation Criteria

The most important aspect of this challenge is to show **how much you know about building and deploying a fullstack web application**. Besides that, we will also evaluate your challenge based on the following criteria:

- **Code quality**: the quality of your code, such as readability, maintainability, and best practices.
- **Architecture**: the architecture of your application, such as the database schema, the API design, and the front-end structure.
- **Documentation**: the documentation of your application, such as the README file and the comments in the code.

_Note: if you have another ways to show your knowledge about building and deploying a fullstack web application, and you think that you don't need to do the entire challenge, please let us know and we can discuss it._

## Other Features You Can Implement

The following features are optional, but you can implement them if you want to show more of your skills and/or learn something new during the challenge:

1. **Admin**: you can implement an admin section to add or remove videos from the database.
1. **I18n**: you can implement internationalization to translate the application to different languages.
1. **Tests**: you can implement tests (unit, integration or e2e) for the API and the front-end.
