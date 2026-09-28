import {
  copyRoot404To404Index,
  deleteOldS3Files,
  getAllFilesInsideADirectory,
  uploadDirectoryToS3,
} from '../s3';
import { type ContentTypes } from './contentTypes';
import {
  defaultBuildFolders,
  findDefaultBuildFolder,
} from './findDefaultBuildFolder';

export const uploadBuiltAppToS3 = async ({
  buildFolder: directory,
  bucket,
  contentTypes,
  uploadSourceMaps,
}: {
  buildFolder?: string;
  bucket: string;
  cloudfront?: boolean;
  contentTypes?: ContentTypes;
  uploadSourceMaps?: boolean;
}) => {
  /**
   * Only empty directory if the number of the files inside $directory.
   * If the number of files is zero, uploadDirectoryToS3 will thrown.
   */
  if (directory) {
    const files = await getAllFilesInsideADirectory({ directory });
    if (files.length > 0) {
      await deleteOldS3Files({ bucket, retentionDays: 7 });
    }
    await uploadDirectoryToS3({
      bucket,
      contentTypes,
      directory,
      uploadSourceMaps,
    });
    return;
  }

  const defaultDirectory = await findDefaultBuildFolder();

  if (defaultDirectory) {
    await deleteOldS3Files({ bucket, retentionDays: 7 });
    await uploadDirectoryToS3({
      bucket,
      contentTypes,
      directory: defaultDirectory,
      uploadSourceMaps,
    });
    await copyRoot404To404Index({ bucket });
    return;
  }

  throw new Error(
    `build-folder option wasn't provided and files weren't found in ${defaultBuildFolders.join(
      ', '
    )} directories.`
  );
};
