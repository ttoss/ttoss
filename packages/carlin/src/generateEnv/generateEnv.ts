import * as fs from 'fs';
import * as path from 'path';
import { getEnvironment } from '../utils';
import log from 'npmlog';

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

/**
 * Generate environment for packages using `carlin`. If [environment](/docs/CLI#environment)
 * isn't defined, `carlin` will read `.env.Staging` file if exists and write
 * `.env` file. If it's `Environment`, it'll read `.env.Environment` file instead.
 * For example, if `environment` is `Production`, `carlin` will read `.env.Production`
 */
export const generateEnv = async ({
  defaultEnvironment,
  path: envsPath,
}: {
  defaultEnvironment: string;
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

  await writeEnvFile({ content: envFile, envFileName: '.env' });

  log.info(
    logPrefix,
    'Generate env file %s from %s successfully.',
    '.env',
    envFileName
  );
};
