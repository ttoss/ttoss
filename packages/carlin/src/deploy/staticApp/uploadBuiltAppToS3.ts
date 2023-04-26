import {
  copyRoot404To404Index,
  emptyS3Directory,
  getAllFilesInsideADirectory,
  uploadDirectoryToS3,
} from '../s3';
import {
  defaultBuildFolders,
  findDefaultBuildFolder,
} from './findDefaultBuildFolder';

export const uploadBuiltAppToS3 = async ({
  buildFolder: directory,
  bucket,
}: {
  buildFolder?: string;
  bucket: string;
  cloudfront?: boolean;
}) => {
  /**
   * Only empty directory if the number of the files inside $directory.
   * If the number of files is zero, uploadDirectoryToS3 will thrown.
   */
  if (directory) {
    const files = await getAllFilesInsideADirectory({ directory });
    if (files.length > 0) {
      await emptyS3Directory({ bucket });
    }
    await uploadDirectoryToS3({ bucket, directory });
    return;
  }

  const defaultDirectory = await findDefaultBuildFolder();

  if (defaultDirectory) {
    await emptyS3Directory({ bucket });
    await uploadDirectoryToS3({ bucket, directory: defaultDirectory });
    await copyRoot404To404Index({ bucket });
    return;
  }

  throw new Error(
    `build-folder option wasn't provided and files weren't found in ${defaultBuildFolders.join(
      ', '
    )} directories.`
  );
};
