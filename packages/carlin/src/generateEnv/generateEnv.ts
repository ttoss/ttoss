import * as fs from 'node:fs';
import * as path from 'node:path';

import log from 'npmlog';

import { LATEST_DEPLOY_OUTPUTS_FILENAME } from '../deploy/config';
import { getEnvironment } from '../utils';

const logPrefix = 'generate-env';

const readEnvFile = async ({
  envFileName,
  envsPath,
}: {
  envFileName: string;
  envsPath: string;
}) => {
  try {
    const content = await fs.promises.readFile(
      path.resolve(process.cwd(), envsPath, envFileName),
      'utf8'
    );
    return content;
  } catch {
    return undefined;
  }
};

const writeEnvFile = async ({
  envFileName,
  content,
}: {
  envFileName: string;
  content: string;
}) => {
  return fs.promises.writeFile(
    path.resolve(process.cwd(), envFileName),
    content
  );
};

export type DeployOutput = {
  dir: string;
  variables: Record<string, string>;
};

const readDeployOutputLines = async ({
  envFromDeployOutputs,
}: {
  envFromDeployOutputs: DeployOutput[];
}) => {
  const lines: string[] = [];

  for (const { dir, variables } of envFromDeployOutputs) {
    const latestDeployPath = path.resolve(
      process.cwd(),
      dir,
      '.carlin',
      LATEST_DEPLOY_OUTPUTS_FILENAME
    );

    let latestDeploy: Record<string, unknown>;

    try {
      const raw = await fs.promises.readFile(latestDeployPath, 'utf8');
      latestDeploy = JSON.parse(raw);
    } catch {
      log.warn(
        logPrefix,
        'Could not read latest-deploy.json from %s. Skipping.',
        latestDeployPath
      );
      continue;
    }

    const outputs =
      (latestDeploy as { outputs?: Record<string, Record<string, string>> })
        .outputs ?? {};

    for (const [envVarName, outputPath] of Object.entries(variables)) {
      const dotIndex = outputPath.indexOf('.');
      const outputKey =
        dotIndex === -1 ? outputPath : outputPath.slice(0, dotIndex);
      const field =
        dotIndex === -1 ? 'OutputValue' : outputPath.slice(dotIndex + 1);

      const outputValue = outputs[outputKey]?.[field];

      if (outputValue === undefined) {
        log.warn(
          logPrefix,
          'Output path "%s" not found in %s. Skipping %s.',
          outputPath,
          latestDeployPath,
          envVarName
        );
        continue;
      }

      lines.push(`${envVarName}=${outputValue}`);
    }
  }

  return lines;
};

/**
 * Generate environment for packages using `carlin`. If [environment](/docs/CLI#environment)
 * isn't defined, `carlin` will read `.env.Staging` file if exists and write
 * `.env` file. If it's `Environment`, it'll read `.env.Environment` file instead.
 * For example, if `environment` is `Production`, `carlin` will read `.env.Production`
 */
export const generateEnv = async ({
  defaultEnvironment,
  envFromDeployOutputs,
  path: envsPath,
}: {
  defaultEnvironment: string;
  envFromDeployOutputs?: DeployOutput[] | null;
  path: string;
}) => {
  const environment = getEnvironment() || defaultEnvironment;

  const envFileName = `.env.${environment}`;

  const envFile = await readEnvFile({ envFileName, envsPath });

  if (!envFile) {
    log.info(
      logPrefix,
      "Env file %s doesn't exist. Skip generating env file.",
      envFileName
    );

    return;
  }

  const deployOutputLines =
    envFromDeployOutputs && envFromDeployOutputs.length > 0
      ? await readDeployOutputLines({ envFromDeployOutputs })
      : [];

  const deployOutputKeys = new Set(
    deployOutputLines.map((line) => {
      return line.split('=')[0];
    })
  );

  const filteredEnvFile = envFile
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return true;
      }

      const key = trimmed.split('=')[0].trim();

      return !deployOutputKeys.has(key);
    })
    .join('\n');

  const content =
    deployOutputLines.length > 0
      ? `${filteredEnvFile}\n${deployOutputLines.join('\n')}\n`
      : envFile;

  await writeEnvFile({ content, envFileName: '.env' });

  log.info(
    logPrefix,
    'Generate env file %s from %s successfully.',
    '.env',
    envFileName
  );
};
