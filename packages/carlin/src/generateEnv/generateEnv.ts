import * as fs from 'fs';
import * as path from 'path';
import { getEnvironment } from '../utils';
import log from 'npmlog';

const logPrefix = 'generate-env';

const getEnvFilePath = ({ envFileName }: { envFileName: string }) => {
  return path.resolve(process.cwd(), envFileName);
};

const readEnvFile = async ({ envFileName }: { envFileName: string }) => {
  try {
    const content = await fs.promises.readFile(
      getEnvFilePath({ envFileName }),
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
  return fs.promises.writeFile(getEnvFilePath({ envFileName }), content);
};

/**
 * Generate environment for packages using `carlin`. If [environment](/docs/CLI#environment)
 * isn't defined, `carlin` will read `.env` file if exists, merge with
 * additional environment variables and write the result to `.env.local` file. If it's `Environment`,
 * it'll read `.env.Environment` file instead.
 *
 * We chose the name `.env.local` because it works for [Next.js](https://nextjs.org/docs/basic-features/environment-variables)
 * and [CRA](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used) projects.
 */
export const generateEnv = async () => {
  const environment = getEnvironment();

  const envFileName = environment ? `.env.${environment}` : '.env';

  let envFile = await readEnvFile({ envFileName });

  if (!envFile) {
    if (environment) {
      log.info(
        logPrefix,
        "Env file %s doesn't exist, reading .env.",
        envFileName
      );
    }

    envFile = await readEnvFile({ envFileName: '.env' });

    if (!envFile) {
      log.info(logPrefix, "Env file %s doesn't exist.", '.env');
      return;
    }
  }

  await writeEnvFile({ content: envFile, envFileName: '.env.local' });

  log.info(
    logPrefix,
    'Generate env file %s from %s successfully.',
    '.env.local',
    envFileName
  );
};
