import { deleteS3Directory, s3 } from '../s3';
import log from 'npmlog';
import semver from 'semver';

const logPrefix = 'static-app';

/**
 * When a static-app deployment is executed, the algorithm delete old versions
 * if there are three newer versions, and keep these three. For instance, if
 * the bucket has the versions/folders below:
 *
 * - `9.0.1/`
 * - `9.0.2/`
 * - `9.2.0/`
 * - `9.3.0/`
 * - `9.3.1/`
 * - `10.0.0/` _<- created by the last deploy._
 *
 * The folders `9.0.1/`, `9.0.2/`, and `9.2.0/` will be delete after the
 * deploy.
 */
export const removeOldVersions = async ({ bucket }: { bucket: string }) => {
  try {
    log.info(logPrefix, 'Removing old versions...');

    const { CommonPrefixes = [] } = await s3
      .listObjectsV2({ Bucket: bucket, Delimiter: '/' })
      .promise();

    const versions = CommonPrefixes?.map(({ Prefix }) => {
      return Prefix?.replace('/', '');
    })
      .filter((version) => {
        return semver.valid(version);
      })
      .sort((a, b) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return semver.gt(a!, b!) ? -1 : 1;
      });

    /**
     * Keep the 3 most recent versions.
     */
    versions.shift();
    versions.shift();
    versions.shift();

    await Promise.all(
      versions.map((version) => {
        return deleteS3Directory({ bucket, directory: `${version}` });
      })
    );
  } catch (error) {
    log.info(
      logPrefix,
      `Cannot remove older versions from "${bucket}" bucket.`
    );
  }
};
