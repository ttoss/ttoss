# ttoss Challenge - Engineering

As part of [The Best YouTube Video of All Time](https://ttoss.dev/docs/challenge/the-project) project, your challenge is to design and build a complete web application, encompassing database architecture, API design, front-end development, and deployment.

## Challenge Overview

This challenge is intentionally **open-ended**. We'll outline the main requirements and features, but you're free to choose the tools and technologies that best suit the project—except where specific technologies are mentioned.

The goal is to demonstrate your ability to architect and implement a full-stack application while making thoughtful technical decisions.

_**Note**: If you have other ways to demonstrate your skills—such as focusing on a specific part of the challenge or showcasing related past work—let us know. We're happy to discuss how you can best highlight your expertise._

## Requirements

Before diving into the technical requirements, keep in mind that this challenge values practicality and thoughtful design over perfection. Focus on delivering a functional and maintainable solution while considering basic performance and security practices. Advanced features or optimizations are welcome but not mandatory.

### Database

The database must store information about the videos and their rankings. You can choose one of the following options:

- **DynamoDB**: Use a [single-table design](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/) ([_initial example provided here_](https://github.com/ttoss/ttoss/tree/main/challenge/packages/db-dynamodb)).
- **PostgreSQL**: Design a schema tailored for the project.
- **Other**: Feel free to suggest and use another database that aligns with your vision.

Your database design doesn't need to account for extremely large-scale systems but should be robust enough to handle a growing dataset of videos and votes. Focus on simplicity and logical organization of data.

### API

The API should enable the following functionalities:

- **Retrieve a ranked list of videos**.
- **Fetch two videos for user voting**.
- **Register a vote** and update the Elo ranking accordingly.
- **Additional resources**: If you identify other useful endpoints, feel free to add them.

While advanced API security (e.g., OAuth2, JWT expiration) is not required, ensure that your API is protected against basic threats like SQL Injection or unauthorized access. Focus on delivering the core functionalities efficiently and reliably.

#### Implementation Notes:

- Use [Node.js](https://nodejs.org/en) to build the API.
- You can choose REST or GraphQL ([_initial example provided here_](https://github.com/ttoss/ttoss/tree/main/challenge/packages/api-graphql-with-dynamodb)).

### Front-end

The front-end should provide an engaging user interface with at least the following features:

- **Voting Page**: Display two videos for the user to vote on.
- **Ranking Page**: Show a dynamically updated list of video rankings.
- **Additional Features**: Any other functionality you think enhances the user experience.

Your front-end doesn't need to implement sophisticated UI/UX designs but should be responsive and user-friendly. Ensure the application works seamlessly on both desktop and mobile devices.

#### Implementation Notes:

- Use [React](https://react.dev/) for front-end development.
- You may use our boilerplate ([Vite.js + GraphQL API](<(https://github.com/ttoss/ttoss/tree/main/challenge/packages/app-vite-with-graphql-api)>)) or start from scratch.

## Deployment or Demo

To complete the challenge, your project should be accessible for evaluation. This involves:

- **Publishing the code**: The complete source code should be hosted in a public or private web-based repository, such as GitHub, GitLab, or Bitbucket. Ensure the repository includes clear instructions on how to set up and run the project.
- **Publishing the application**: Deploy the project to a live environment (e.g., AWS, Vercel, Netlify) so it is accessible via a URL.
- **Providing a demo**: If publishing is not feasible, record a demo video showing the application in action and walk through its key features.

## Support Provided

During the challenge, we can provide the following resources:

- **DynamoDB table** or **PostgreSQL database**.
- Access to an **AWS account** or a **virtual machine**.
- **Mentorship** from our team to guide you through technical decisions or questions.

## Evaluation Criteria

We're primarily evaluating how well you can **design, implement, and deploy a full-stack web application**. In addition, we'll assess:

- **Code Quality**: Readability, maintainability, and adherence to best practices.
- **Architecture**: Thoughtfulness in database schema, API design, and front-end structure.
- **Documentation**: Clear README and in-code comments explaining your decisions.

We will not evaluate factors like highly optimized performance or advanced infrastructure automation. Instead, we value clear decision-making, maintainability, and adherence to the core requirements.

## Optional Features

If you'd like to demonstrate additional skills or explore new concepts, consider implementing:

1. **Admin Interface**: Add functionality for managing videos (add/remove).
1. **Internationalization (i18n)**: Support for multiple languages.
1. **Testing**: Write unit, integration, or end-to-end tests for both the API and the front-end.
