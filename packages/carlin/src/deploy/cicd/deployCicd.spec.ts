// /* eslint-disable import/first */
// import * as faker from 'faker';

// const deployMock = jest.fn();

// jest.mock('../cloudformation.core', () => ({
//   deploy: deployMock,
// }));

// const stackName = faker.word.words();

// jest.mock('./getStackName', () => ({
//   getStackName: jest.fn().mockResolvedValue(stackName),
// }));

// const template = faker.word.words();

// jest.mock('./getCicdTemplate', () => ({
//   getCicdTemplate: jest.fn().mockReturnValue(template),
// }));

import { getLambdaInput } from './deployCicd';

describe('lambda input directory', () => {
  test('should read the .js file', () => {
    expect(getLambdaInput('js')).toEqual(`${__dirname}/lambdas/index.js`);
  });

  test('should read the .ts file', () => {
    expect(getLambdaInput('ts')).toEqual(`${__dirname}/lambdas/index.ts`);
  });
});

// test('should call deploy method with correctly parameters', async () => {
//   await deployCicd();
//   expect(deployMock).toHaveBeenCalledWith({
//     params: { StackName: stackName },
//     terminationProtection: true,
//     template,
//   });
// });
