import { ProxyHandler } from 'aws-lambda';
import { executeTasks } from './executeTasks';
import { getProcessEnvVariable } from './getProcessEnvVariable';
import AWS from 'aws-sdk';

const codebuild = new AWS.CodeBuild({ apiVersion: '2016-10-06' });

/**
 * The CI/CD REST API is responsible to update the image of the repository and
 * running tasks inside a container using [ECS Fargate](https://aws.amazon.com/fargate/).
 * The API URL has the format of an [AWS API Gateway](https://aws.amazon.com/api-gateway/) URL:
 *
 * ```sh
 * https://<api-id>.execute-api.<region>.amazonaws.com/v1
 * ```
 *
 * It can be found on the "Outputs" tab if you access the CI/CD stack details
 * from AWS Console or by the output `ApiV1Endpoint` that is printed after the
 * stack creation.
 *
 * Such API has the `/cicd` endpoint, that is consumed by a POST method. This
 * endpoint has two actions, defined by the `action` property, passed inside
 * the body of the POST method.
 *
 * - **updateRepository**
 *
 *   This action update the repository image on AWS ECR. This command is useful
 *   to you update your _node_modules_ folder or your [Yarn cache](https://classic.yarnpkg.com/en/docs/cli/cache/).
 *
 *   Body interface:
 *
 *   ```ts
 *   {
 *     action: "updateRepository";
 *   }
 *   ```
 *
 * - **executeTask**
 *
 *   This action create an execution of your repository image using [ECS Fargate](https://aws.amazon.com/fargate/).
 *   The commands that will be executed is passed by the `commands` property,
 *   which receives an array of commands. You can also provide the following
 *   properties:
 *
 *   - `cpu`: CPU value reserved for the task.
 *   - `memory`: memory value reserved for the task.
 *   - `taskEnvironment`: list of environment variables that can be accessed
 *     on task execution.
 *
 *   Body interface:
 *
 *   ```ts
 *   {
 *      action: "executeTask";
 *      commands: string[];
 *      cpu?: string;
 *      memory?: string;
 *      taskEnvironment?: Array<{ name: string; value: string }>;
 *   }
 *   ```
 *
 *   Example:
 *
 *   ```json
 *   {
 *      "action": "executeTask",
 *      "commands": [
 *        "git status",
 *        "git pull origin main",
 *        "yarn",
 *        "yarn test"
 *      ],
 *      "cpu": "1024",
 *      "memory": "2048",
 *      "taskEnvironment": [
 *        {
 *           "name": "CI",
 *           "value": "true"
 *        }
 *      ]
 *   }
 *   ```
 *
 */
export const cicdApiV1Handler: ProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || JSON.stringify({}));

    let response;

    if (body.action === 'updateRepository') {
      response = await codebuild
        .startBuild({
          projectName: getProcessEnvVariable(
            'PROCESS_ENV_REPOSITORY_IMAGE_CODE_BUILD_PROJECT_NAME'
          ),
        })
        .promise();
    }

    if (body.action === 'executeTask') {
      const { commands = [], cpu, memory, taskEnvironment = [] } = body;

      if (commands.length === 0) {
        throw new Error('Commands were not provided.');
      }

      response = await executeTasks({ commands, cpu, memory, taskEnvironment });
    }

    if (response) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(response),
      };
    }

    return {
      statusCode: 403,
      body: 'Execute access forbidden',
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return {
      statusCode: 400,
      body: error.message,
    };
  }
};
