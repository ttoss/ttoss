import { getEnvironment, spawn } from '../../utils';
import { handleDeployError } from '../utils';
import log from 'npmlog';

const logPrefix = 'deploy vercel';

const makeCommand = (cmds: string[]) => {
  return cmds
    .filter((cmd) => {
      return cmd !== undefined && cmd !== null && cmd !== '';
    })
    .join(' ');
};

/**
 * https://vercel.com/docs/cli
 */
export const deployVercel = async ({ token }: { token?: string }) => {
  try {
    log.info(logPrefix, 'Deploying on Vercel...');

    const environment = getEnvironment();

    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const finalToken = token || process.env.VERCEL_TOKEN;

    if (!finalToken) {
      throw new Error('Missing Vercel token');
    }

    const cmdToken = finalToken ? `--token=${finalToken}` : '';

    const cmdProdFlag = environment === 'Production' ? '--prod' : '';

    const cmdEnvironment = `--environment=${
      environment === 'Production' ? 'production' : 'preview'
    }`;

    const pullCmd = makeCommand([
      'vercel',
      'pull',
      '--yes',
      cmdEnvironment,
      cmdToken,
    ]);

    await spawn(pullCmd);

    /**
     * https://vercel.com/docs/cli/build
     */
    const buildCdm = makeCommand(['vercel', 'build', cmdProdFlag, cmdToken]);

    await spawn(buildCdm);

    const deployCmd = makeCommand([
      'vercel',
      'deploy',
      '--prebuilt',
      cmdProdFlag,
      cmdToken,
    ]);

    await spawn(deployCmd);
  } catch (error: any) {
    handleDeployError({ error, logPrefix });
  }
};
