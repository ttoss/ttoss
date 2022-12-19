import { getAllFilesInsideADirectory } from '../s3';

/**
 * Fixes #20 https://github.com/ttoss/carlin/issues/20
 */
export const defaultBuildFolders = [
  /**
   * Create React App default build folder
   */
  'build',
  /**
   * Next.js default output folder
   */
  'out',
  /**
   * Storybook default output folder
   */
  'storybook-static',
  /**
   * Vite.js default build folder
   */
  'dist',
];

export const findDefaultBuildFolder = async () => {
  /**
   * Valid folders have at least one file inside.
   */
  const validFolders = await Promise.all(
    defaultBuildFolders.map(async (directory) => {
      const allFiles = await getAllFilesInsideADirectory({
        directory,
      });

      return { directory, isValid: allFiles.length !== 0 };
    })
  );

  const validFolder = validFolders.reduce((acc, cur) => {
    if (cur.isValid) {
      return cur.directory;
    }

    return acc;
  }, '');

  return validFolder;
};
