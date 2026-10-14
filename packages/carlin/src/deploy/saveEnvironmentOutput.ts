import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Output } from '@aws-sdk/client-cloudformation';

import { getEnvironment, getPackageName, getProjectName } from '../utils';
import { LATEST_DEPLOY_OUTPUTS_FILENAME } from './config';

export const saveEnvironmentOutput = async ({
  outputs,
  stackName,
}: {
  outputs: Output[];
  stackName: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envFile: any = {
    stackName,
    environment: getEnvironment(),
    projectName: getProjectName(),
    packageName: getPackageName(),
  };

  envFile.outputs = outputs.reduce((acc, output) => {
    if (!output.OutputKey || !output) {
      return acc;
    }

    return {
      ...acc,
      [output.OutputKey]: output,
    };
  }, {});

  const dotCarlinFolderPath = path.join(process.cwd(), '.carlin');

  if (!fs.existsSync(dotCarlinFolderPath)) {
    await fs.promises.mkdir(dotCarlinFolderPath);
  }

  const filePath = path.join(dotCarlinFolderPath, `${stackName}.json`);

  await fs.promises.writeFile(filePath, JSON.stringify(envFile, null, 2));

  const latestFilePath = path.join(
    dotCarlinFolderPath,
    LATEST_DEPLOY_OUTPUTS_FILENAME
  );

  await fs.promises.writeFile(latestFilePath, JSON.stringify(envFile, null, 2));
};
