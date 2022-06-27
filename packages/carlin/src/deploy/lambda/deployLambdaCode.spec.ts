jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as any),
  existsSync: jest.fn(),
}));

jest.mock('./buildLambdaSingleFile');

jest.mock('./deployLambdaLayers');

jest.mock('./uploadCodeToECR');

jest.mock('./uploadCodeToS3');

import * as fs from 'fs';
import { buildLambdaSingleFile } from './buildLambdaSingleFile';
import { deployLambdaCode } from './deployLambdaCode';
import { deployLambdaLayers } from './deployLambdaLayers';
import { faker } from '@ttoss/test-utils/faker';
import { uploadCodeToECR } from './uploadCodeToECR';
import { uploadCodeToS3 } from './uploadCodeToS3';

const lambdaInput = faker.random.word();

const stackName = faker.random.word();

const lambdaExternals = [...new Array(5)].map(() => faker.random.word());

const bucket = {
  bucket: faker.random.word(),
  key: faker.random.word(),
  versionId: faker.random.word(),
};

beforeEach(() => {
  (fs.existsSync as jest.Mock).mockImplementation((input) => {
    return lambdaInput === input;
  });

  (uploadCodeToS3 as jest.Mock).mockResolvedValue(bucket);
});

test("return undefined if lambda input doesn't exist", async () => {
  const response = await deployLambdaCode({
    /**
     * Guarantee that lambda input will never be equal lambdaInput.
     */
    lambdaInput: `${faker.random.word()}${lambdaInput}`,
    lambdaExternals,
    stackName,
  });

  expect(response).toBeUndefined();
});

test('upload code to S3 if lambdaImage is falsy', async () => {
  const response = await deployLambdaCode({
    lambdaInput,
    lambdaExternals,
    stackName,
  });

  expect(buildLambdaSingleFile).toHaveBeenCalledWith({
    lambdaExternals,
    lambdaInput,
  });

  expect(deployLambdaLayers).toHaveBeenCalledWith({
    lambdaExternals,
  });

  expect(response).toEqual(bucket);
});

test('upload code to ECR if lambdaImage is truth', async () => {
  const imageUri = faker.random.word();

  (uploadCodeToECR as jest.Mock).mockResolvedValue({ imageUri });

  const response = await deployLambdaCode({
    lambdaInput,
    lambdaExternals,
    stackName,
    lambdaImage: true,
  });

  expect(buildLambdaSingleFile).toHaveBeenCalledWith({
    lambdaExternals,
    lambdaInput,
  });

  expect(uploadCodeToECR).toHaveBeenCalledWith({
    ...bucket,
    lambdaExternals,
  });

  expect(response).toEqual({ imageUri });
});
