import * as findUp from 'find-up';
import fs from 'fs';

const readPackageJson = () => {
  const packageJsonDir = findUp.findUpSync('package.json');

  if (!packageJsonDir) {
    return {};
  }

  return JSON.parse(fs.readFileSync(packageJsonDir).toString());
};

const getPackageJsonProperty = ({ property }: { property: string }) => {
  try {
    return readPackageJson()[property];
  } catch {
    return '';
  }
};

export const getPackageName = (): string => {
  return getPackageJsonProperty({ property: 'name' });
};

export const getPackageVersion = (): string => {
  return getPackageJsonProperty({ property: 'version' });
};
