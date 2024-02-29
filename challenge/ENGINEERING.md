# ttoss Challenge - Engineering

Given the description of the project The Best YouTube Video of All Time, the engineering challenge consists of building a web application from database architecture, API design, and front-end development and deployment.

## Requirements

A characteristic of this challenge is that it is open-ended. We'll provide the requirements and the main features that the application should have, but you have the freedom to choose the technologies and tools that you think are best for the project, except when we specify them.

### Database

The database should store the information about the videos and their ranking. You can use:

- Use a DynamoDB table with [single-table design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/).

- Use a PostgreSQL database with a schema that you think is best for the project.

- Any other database that you think is best for the project.

### API

The API should provide at least the following resources:

- Get a list of videos with pagination, sorted by their ranking.
- Get two videos for the user to vote.
- A mutation to register the user's vote and update the ranking.
- Any other resource that you think is best for the project.

You can implement the API using REST or GraphQL, but it should use Node.js.

### Front-end

The front-end should have at least the following features:

- A section to show two videos for the user to vote.

- A section to show the ranking of the videos.

- Any other feature that you think is best for the project.

You need to use React to build the front-end.

### Deployment

The application should be deployed as a serverless application on AWS or in a virtual machine.

## We can provide you with:

During this challenge, we can provide you with the following resources:

- If you choose to use DynamoDB, we can provide you with an DynamoDB table.

- If you choose to deploy the application as a serverless application, we can provide you with an AWS account.

- If you choose to deploy the application in a virtual machine, we can provide you with a virtual machine.

- Mentorship from our team to help you with the challenge.

## Evaluation Criteria

The most important aspect of this challenge is to show **how much you know about building and deploying a fullstack web application**. Besides that, we will also evaluate your challenge based on the following criteria:

- **Code quality**: the quality of your code, such as readability, maintainability, and best practices.

- **Architecture**: the architecture of your application, such as the database schema, the API design, and the front-end structure.

- **Documentation**: the documentation of your application, such as the README file and the comments in the code.

- **Testing**: the tests that you write for your application.

_Note: if you have another ways to show your knowledge about building and deploying a fullstack web application, and you think that you don't need to do the entire challenge, please let us know and we can discuss it._
