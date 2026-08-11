import { faker } from '@ttoss/test-utils/faker';

import { AWS_DEFAULT_REGION } from '../../config';
import { deploy } from '../cloudformation.core';
import { deployStaticApp } from './deployStaticApp';
import { getStaticAppBucket } from './getStaticAppBucket';
import { uploadBuiltAppToS3 } from './uploadBuiltAppToS3';

jest.mock('../cloudformation.core');

jest.mock('../s3');

jest.mock('./getStaticAppBucket');

jest.mock('./invalidateCloudFront');

jest.mock('./uploadBuiltAppToS3');

const region = AWS_DEFAULT_REGION;

const buildFolder = faker.word.words();

const bucket = faker.word.words();

beforeEach(() => {
  jest.clearAllMocks();
});

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
    uploadSourceMaps: undefined,
  });
});

/**
 * The stack-exists and stack-missing paths call uploadBuiltAppToS3 separately.
 * A first-ever deploy takes the second one, so forwarding the option through
 * only the first would publish source maps on exactly the deploys nobody
 * re-checks.
 */
describe('uploadSourceMaps', () => {
  test.each([true, false])(
    'should forward uploadSourceMaps=%s when the bucket already exists',
    async (uploadSourceMaps) => {
      (getStaticAppBucket as jest.Mock).mockResolvedValue(bucket);
      (deploy as jest.Mock).mockResolvedValue({ Outputs: [] });

      await deployStaticApp({ buildFolder, region, uploadSourceMaps });

      expect(uploadBuiltAppToS3).toHaveBeenCalledWith(
        expect.objectContaining({ bucket, uploadSourceMaps })
      );
    }
  );

  test.each([true, false])(
    'should forward uploadSourceMaps=%s when the bucket is created by this deploy',
    async (uploadSourceMaps) => {
      const newBucket = faker.word.words();

      (getStaticAppBucket as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(newBucket);
      (deploy as jest.Mock).mockResolvedValue({ Outputs: [] });

      await deployStaticApp({ buildFolder, region, uploadSourceMaps });

      expect(uploadBuiltAppToS3).toHaveBeenCalledWith(
        expect.objectContaining({ bucket: newBucket, uploadSourceMaps })
      );
    }
  );
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
