/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { S3 } from 'aws-sdk';
import { glob } from 'glob';
import fs from 'fs';
import log from 'npmlog';
import mime from 'mime-types';
import path from 'path';

const logPrefix = 's3';

export const s3 = new S3({ apiVersion: '2006-03-01' });

export const getBucketKeyUrl = ({
  bucket,
  key,
}: {
  bucket: string;
  key: string;
}) => {
  return `https://s3.amazonaws.com/${bucket}/${key}`;
};

export const uploadFileToS3 = async ({
  bucket,
  contentType,
  file,
  filePath,
  key,
}: {
  bucket: string;
  contentType?: string;
  file?: Buffer;
  filePath?: string;
  key: string;
}) => {
  if (!file && !filePath) {
    throw new Error('file or filePath must be defined');
  }

  let params: S3.PutObjectRequest = {
    Bucket: bucket,
    Key: key.split(path.sep).join('/'),
  };

  if (file) {
    params.ContentType = contentType;
    params.Body = file;
  } else if (filePath) {
    const readFile = await fs.promises.readFile(filePath);
    params = {
      ...params,
      ContentType:
        contentType || mime.contentType(path.extname(filePath)) || undefined,
    };
    params.Body = Buffer.from(readFile);
  }

  const { Bucket, Key, VersionId } = (await s3.upload(params).promise()) as any;

  return {
    bucket: Bucket as string,
    key: Key as string,
    versionId: VersionId as string,
    url: getBucketKeyUrl({ bucket: Bucket, key: Key }),
  };
};

/**
 * Get all files inside $directory.
 */
export const getAllFilesInsideADirectory = async ({
  directory,
}: {
  directory: string;
}) => {
  const allFilesAndDirectories = await glob(`${directory}/**/*`);

  const allFiles = allFilesAndDirectories
    /**
     * Remove directories.
     */
    .filter((item) => {
      return fs.lstatSync(item).isFile();
    });

  return allFiles;
};

/**
 * Docusaurus 2 has a 404.html file in the root of the build folder. This
 * function copies it to 404/index.html so that it can be served by S3 and
 * CloudFront.
 */
export const copyRoot404To404Index = async ({ bucket }: { bucket: string }) => {
  // check if root 404 exists and if it does, copy it to 404/index.html
  const root404Exists = await s3
    .headObject({
      Bucket: bucket,
      Key: '404.html',
    })
    .promise();

  if (root404Exists) {
    await s3
      .copyObject({
        Bucket: bucket,
        CopySource: `${bucket}/404.html`,
        Key: '404/index.html',
      })
      .promise();
  }
};

export const uploadDirectoryToS3 = async ({
  bucket,
  bucketKey = '',
  directory,
}: {
  bucket: string;
  bucketKey?: string;
  directory: string;
}) => {
  log.info(
    logPrefix,
    `Uploading directory ${directory}/ to ${bucket}/${bucketKey}...`
  );

  const allFiles = await getAllFilesInsideADirectory({ directory });

  /**
   * If the folder has no files (the folder name may be wrong), thrown an
   * error. Discovered at #16 https://github.com/ttoss/carlin/issues/16.
   */
  if (allFiles.length === 0) {
    throw new Error(`Directory ${directory}/ has no files.`);
  }

  const GROUP_MAX_LENGTH = 63;

  const numberOfGroups = Math.ceil(allFiles.length / GROUP_MAX_LENGTH);

  /**
   * Divide all files and create "numberOfGroups" groups of files whose max
   * length is GROUP_MAX_LENGTH.
   */
  const aoaOfFiles = allFiles.reduce<string[][]>((acc, file, index) => {
    const groupIndex = index % numberOfGroups;
    if (!acc[groupIndex]) {
      acc[groupIndex] = [];
    }
    acc[index % numberOfGroups].push(file);
    return acc;
  }, []);

  for (const [index, groupOfFiles] of aoaOfFiles.entries()) {
    log.info(logPrefix, `Uploading group ${index + 1}/${aoaOfFiles.length}...`);
    await Promise.all(
      groupOfFiles.map((file) => {
        return uploadFileToS3({
          bucket,
          key: path.join(bucketKey, path.relative(directory, file)),
          filePath: file,
        });
      })
    );
  }
};

export const emptyS3Directory = async ({
  bucket,
  directory = '',
}: {
  bucket: string;
  directory?: string;
}) => {
  log.info(logPrefix, `${bucket}/${directory} will be empty`);
  try {
    const { Contents, IsTruncated } = await s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: directory,
      })
      .promise();

    if (Contents && Contents.length > 0) {
      /**
       * Get object versions
       */
      const objectsPromises = Contents.filter(({ Key }) => {
        return !!Key;
      }).map(async ({ Key }) => {
        const { Versions = [] } = await s3
          .listObjectVersions({
            Bucket: bucket,
            Prefix: Key,
          })
          .promise();
        return {
          Key: Key as string,
          Versions: Versions.map(({ VersionId }) => {
            return VersionId || undefined;
          }),
        };
      });

      const objects = await Promise.all(objectsPromises);

      const objectsWithVersionsIds = objects.reduce<
        Array<{
          Key: string;
          VersionId?: string;
        }>
      >((acc, { Key, Versions }) => {
        const objectWithVersionsIds = Versions.map((VersionId) => {
          return {
            Key,
            VersionId,
          };
        });
        return [...acc, ...objectWithVersionsIds];
      }, []);

      await s3
        .deleteObjects({
          Bucket: bucket,
          Delete: { Objects: objectsWithVersionsIds },
        })
        .promise();
    }

    /**
     * Truncated is files that exists but weren't listed from S3 API.
     */
    if (IsTruncated) {
      await emptyS3Directory({ bucket, directory });
    }

    log.info(logPrefix, `${bucket}/${directory} is empty.`);
  } catch (err) {
    log.error(logPrefix, `Cannot empty ${bucket}/${directory}.`);
    throw err;
  }
};

export const deleteS3Directory = async ({
  bucket,
  directory = '',
}: {
  bucket: string;
  directory?: string;
}) => {
  try {
    log.info(logPrefix, `${bucket}/${directory} is being deleted...`);
    await emptyS3Directory({ bucket, directory });
    await s3.deleteObject({ Bucket: bucket, Key: directory }).promise();
    log.info(logPrefix, `${bucket}/${directory} was deleted.`);
  } catch (error) {
    log.error(logPrefix, `Cannot delete ${bucket}/${directory}.`);
    throw error;
  }
};
