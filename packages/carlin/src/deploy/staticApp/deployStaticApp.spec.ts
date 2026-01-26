jest.mock('../cloudformation.core');

jest.mock('../s3');

jest.mock('./getStaticAppBucket');

jest.mock('./invalidateCloudFront');

jest.mock('./uploadBuiltAppToS3');

import { faker } from '@ttoss/test-utils/faker';

import { AWS_DEFAULT_REGION } from '../../config';
import { deploy } from '../cloudformation.core';
import { deployStaticApp } from './deployStaticApp';
import { getStaticAppBucket } from './getStaticAppBucket';
import { uploadBuiltAppToS3 } from './uploadBuiltAppToS3';

const region = AWS_DEFAULT_REGION;

const buildFolder = faker.word.words();

const bucket = faker.word.words();

test('should call uploadBuiltAppToS3 with correct parameters', async () => {
  const cloudfront = false;

  (getStaticAppBucket as jest.Mock).mockResolvedValue(bucket);

  (deploy as jest.Mock).mockResolvedValue({ Outputs: [] });

  await deployStaticApp({
    buildFolder,
    cloudfront,
    region,
  });

  expect(uploadBuiltAppToS3).toHaveBeenCalledWith({
    buildFolder,
    bucket,
    cloudfront,
  });
});

// uploadDirectoryToS3 bucket key must be undefined if cloudfront is false
// test.skip('uploadDirectoryToS3 bucket key must not be undefined if cloudfront is true', async () => {
//   const cloudfront = true;

//   const version = '2.4.7';

//   /**
//    * Mock packages/cli/src/utils/packageJson.ts read version.
//    */
//   jest.spyOn(fs, 'readFileSync').mockReturnValue({
//     toString: () => JSON.stringify({ version }),
//   } as any);

//   await staticAppModule.deployStaticApp({
//     buildFolder,
//     cloudfront,
//     region,
//   });

//   expect(s3Module.uploadDirectoryToS3).toHaveBeenCalledWith(
//     expect.objectContaining({
//       bucketKey: version,
//     })
//   );
// });
