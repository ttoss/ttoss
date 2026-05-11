/**
 * Shared utility functions for monorepo package operations
 */
import * as fs from 'node:fs';

/**
 * Creates a file with the given content if it doesn't exist
 */
export const createFile = ({
  filePath,
  content,
}: {
  filePath: string;
  content: string;
}) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    // eslint-disable-next-line no-console
    console.log(`✓ Created file: ${filePath}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`- File already exists: ${filePath}`);
  }
};

/**
 * Creates a directory if it doesn't exist
 */
export const createDirectory = ({ dirPath }: { dirPath: string }) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    // eslint-disable-next-line no-console
    console.log(`✓ Created directory: ${dirPath}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`- Directory already exists: ${dirPath}`);
  }
};
