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
    log.info(logPrefix, "Env file %s doesn't exist.", envFileName);
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
 * isn't production, `carlin` will read `.env` file if exists, merge with
 * additional environment variables and write the result to `.env.local` file. If it's `Production`,
 * it'll read `.env.production` file instead.
 *
 * We chose the name `.env.local` because it works for [Next.js](https://nextjs.org/docs/basic-features/environment-variables)
 * and [CRA](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used) projects.
 */
export const generateEnv = async () => {
  const environment = getEnvironment();

  const isProduction = environment?.toLocaleLowerCase() === 'production';

  const envFileName = isProduction ? '.env.production' : '.env';

  const envFile = await readEnvFile({ envFileName });

  if (!envFile) {
    return;
  }

  await writeEnvFile({ content: envFile, envFileName: '.env.local' });

  log.info(
    logPrefix,
    'Generate env file %s from %s successfully.',
    '.env.local',
    envFileName
  );
};
