import fs from 'node:fs';
import path from 'node:path';

import type { S3ClientConfig } from '@aws-sdk/client-s3';
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { glob } from 'glob';
import mime from 'mime-types';
import log from 'npmlog';

import { getEnvVar } from '../utils';

const logPrefix = 's3';

/**
 * S3 client cache to avoid creating multiple clients.
 * Each client is created with different parameters.
 */
const s3Clients: { [key: string]: S3Client } = {};

export const s3 = () => {
  const s3ClientConfig: S3ClientConfig = {
    region: getEnvVar('REGION'),
  };

  const key = JSON.stringify(s3ClientConfig);

  if (!s3Clients[key]) {
    s3Clients[key] = new S3Client(s3ClientConfig);
  }

  return s3Clients[key];
};

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params: any = {
    Bucket: bucket,
    Key: key.split(path.sep).join('/'),
  };

  if (file) {
    params.ContentType = contentType;
    params.Body = file;
  } else if (filePath) {
    const readFile = await fs.promises.readFile(filePath);
    params.ContentType =
      contentType || mime.contentType(path.extname(filePath)) || undefined;
    params.Body = Buffer.from(readFile);
  }

  const upload = new Upload({
    client: s3(),
    params,
  });

  const result = await upload.done();

  return {
    bucket: result.Bucket as string,
    key: result.Key as string,
    versionId: result.VersionId as string,
    url: getBucketKeyUrl({ bucket: result.Bucket!, key: result.Key! }),
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
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: bucket,
      Key: '404.html',
    });
    const root404Exists = await s3()
      .send(headCommand)
      .catch(() => {
        return false;
      });

    if (root404Exists) {
      const copyCommand = new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/404.html`,
        Key: '404/index.html',
      });
      await s3().send(copyCommand);
    }
  } catch (error) {
    log.error(logPrefix, `Cannot copy 404.html to 404/index.html`);
    throw error;
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
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: directory,
    });
    const { Contents, IsTruncated } = await s3().send(listCommand);

    if (Contents && Contents.length > 0) {
      /**
       * Get object versions
       */
      const objectsPromises = Contents.filter(({ Key }) => {
        return !!Key;
      }).map(async ({ Key }) => {
        const listVersionsCommand = new ListObjectVersionsCommand({
          Bucket: bucket,
          Prefix: Key,
        });
        const { Versions = [] } = await s3().send(listVersionsCommand);
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

      /**
       * Batch delete operations in groups of 1000 (AWS limit)
       * https://stackoverflow.com/a/61474768
       */
      const BATCH_SIZE = 1000;
      for (let i = 0; i < objectsWithVersionsIds.length; i += BATCH_SIZE) {
        const batch = objectsWithVersionsIds.slice(i, i + BATCH_SIZE);

        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: batch },
        });
        const result = await s3().send(deleteCommand);

        if (result.Errors && result.Errors.length > 0) {
          const firstError = result.Errors[0];
          throw new Error(
            `Error deleting objects from ${bucket}/${directory}: ${JSON.stringify(firstError)}`
          );
        }
      }
    }

    /**
     * Truncated is files that exists but weren't listed from S3 API.
     */
    if (IsTruncated) {
      await emptyS3Directory({ bucket, directory });
    }

    log.info(logPrefix, `${bucket}/${directory} is empty.`);
  } catch (error) {
    log.error(logPrefix, `Cannot empty ${bucket}/${directory}.`);
    throw error;
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
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucket,
      Key: directory,
    });
    await s3().send(deleteCommand);
    log.info(logPrefix, `${bucket}/${directory} was deleted.`);
  } catch (error) {
    log.error(logPrefix, `Cannot delete ${bucket}/${directory}.`);
    throw error;
  }
};

/**
 * Delete old S3 files based on retention period.
 * Files older than the specified number of days will be deleted.
 */
export const deleteOldS3Files = async ({
  bucket,
  continuationToken,
  directory = '',
  retentionDays,
  totalDeleted = 0,
}: {
  bucket: string;
  continuationToken?: string;
  directory?: string;
  retentionDays: number;
  totalDeleted?: number;
}): Promise<number> => {
  if (!continuationToken) {
    log.info(
      logPrefix,
      `Deleting files older than ${retentionDays} days from ${bucket}/${directory}...`
    );
  }

  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: directory,
      ContinuationToken: continuationToken,
    });
    const { Contents, IsTruncated, NextContinuationToken } =
      await s3().send(listCommand);

    let deletedCount = 0;

    if (Contents && Contents.length > 0) {
      const now = new Date();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

      const oldFiles = Contents.filter(({ Key, LastModified }) => {
        if (!Key || !LastModified) {
          return false;
        }
        const fileAge = now.getTime() - LastModified.getTime();
        return fileAge > retentionMs;
      }).map(({ Key }) => {
        return Key as string;
      });

      if (oldFiles.length > 0) {
        /**
         * Batch delete operations in groups of 1000 (AWS limit)
         */
        const BATCH_SIZE = 1000;
        for (let i = 0; i < oldFiles.length; i += BATCH_SIZE) {
          const batch = oldFiles.slice(i, i + BATCH_SIZE);

          const deleteCommand = new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: batch.map((Key) => {
                return { Key };
              }),
            },
          });
          const result = await s3().send(deleteCommand);

          if (result.Errors && result.Errors.length > 0) {
            const firstError = result.Errors[0];
            throw new Error(
              `Error deleting old files from ${bucket}/${directory}: ${JSON.stringify(firstError)}`
            );
          }
        }

        deletedCount = oldFiles.length;
      }
    }

    /**
     * Handle pagination if results were truncated
     */
    if (IsTruncated && NextContinuationToken) {
      return await deleteOldS3Files({
        bucket,
        continuationToken: NextContinuationToken,
        directory,
        retentionDays,
        totalDeleted: totalDeleted + deletedCount,
      });
    }

    const finalTotal = totalDeleted + deletedCount;

    if (finalTotal === 0) {
      log.info(
        logPrefix,
        `No files older than ${retentionDays} days found in ${bucket}/${directory}`
      );
    } else {
      log.info(
        logPrefix,
        `Deleted ${finalTotal} old files from ${bucket}/${directory}`
      );
    }

    return finalTotal;
  } catch (error) {
    log.error(
      logPrefix,
      `Cannot delete old files from ${bucket}/${directory}.`
    );
    throw error;
  }
};
