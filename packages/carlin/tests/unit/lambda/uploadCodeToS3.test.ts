jest.mock('../../../src/deploy/s3', () => {
  return {
    uploadFileToS3: jest.fn(),
  };
});

const bucketNameMock = 'myBucketName-1234567890';

jest.mock('../../../src/deploy/baseStack/getBaseStackResource', () => {
  return {
    getBaseStackResource: jest.fn().mockResolvedValue(bucketNameMock),
  };
});

import * as deployS3 from '../../../src/deploy/s3';
import { buildLambdaCode } from '../../../src/deploy/lambda/buildLambdaCode';
import {
  uploadCodeToS3,
  zipFileName,
} from '../../../src/deploy/lambda/uploadCodeToS3';
import AdmZip from 'adm-zip';
import fs from 'node:fs';

const outdir1 = 'tests/dist/uploadCodeToS3-1';

const outdir2 = 'tests/dist/uploadCodeToS3-2';

const stackName = 'stackName';

const lambdaEntryPoints = ['lambda.ts', 'module1/method1.ts'];

beforeAll(async () => {
  if (fs.existsSync(outdir1)) {
    fs.rmSync(outdir1, { recursive: true });
  }

  if (fs.existsSync(outdir2)) {
    fs.rmSync(outdir2, { recursive: true });
  }
});

test('create zip file properly', async () => {
  await buildLambdaCode({
    lambdaExternal: [],
    lambdaEntryPoints,
    lambdaEntryPointsBasePath: 'tests/__fixtures__/lambdaCodeExample',
    lambdaOutdir: outdir1,
  });

  await uploadCodeToS3({
    stackName,
    lambdaOutdir: outdir1,
  });

  const zip = new AdmZip(`${outdir1}/${zipFileName}`);

  // match the files in the zip
  for (const entryPoint of lambdaEntryPoints) {
    const filePath = `${entryPoint}`.replace('.ts', '.js');
    const file = fs.readFileSync(`${outdir1}/${filePath}`);
    const zipFile = zip.getEntry(filePath);
    expect(zipFile).toBeTruthy();
    expect(zipFile?.getData().toString()).toBe(file.toString());
  }
});

test('call uploadFileToS3 with the right parameters', async () => {
  await buildLambdaCode({
    lambdaExternal: [],
    lambdaEntryPoints,
    lambdaEntryPointsBasePath: 'tests/__fixtures__/lambdaCodeExample',
    lambdaOutdir: outdir2,
  });

  /**
   * Zip before uploadCodeToS3 to avoid the created zip file to be added to the
   * zip file.
   */
  const zip = new AdmZip();
  zip.addLocalFolder(outdir2);
  zip.writeZip(`${outdir2}/${zipFileName}`);

  await uploadCodeToS3({
    stackName,
    lambdaOutdir: outdir2,
  });

  expect(deployS3.uploadFileToS3).toHaveBeenCalledWith({
    bucket: bucketNameMock,
    contentType: 'application/zip',
    key: `lambdas/${stackName}/${zipFileName}`,
    file: zip.toBuffer(),
  });
});
