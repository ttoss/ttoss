import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import path from 'node:path';

import { parse } from 'dotenv';

const git = ({ args, cwd }: { args: string[]; cwd: string }) => {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
};

/**
 * Reads `DATABASE_GIT_BRANCH` the way the commands load the environment:
 * `.env.<environment>` wins over the process environment.
 */
const readBranch = ({
  environment,
  cwd,
}: {
  environment: string;
  cwd: string;
}) => {
  const envPath = path.resolve(cwd, `.env.${environment}`);
  const fromFile = fs.existsSync(envPath)
    ? parse(fs.readFileSync(envPath)).DATABASE_GIT_BRANCH
    : undefined;

  return fromFile || process.env.DATABASE_GIT_BRANCH;
};

/**
 * When the environment sets `DATABASE_GIT_BRANCH`, a command that writes the
 * schema may run only from a clean checkout whose `HEAD` is exactly
 * `origin/<branch>`. A checkout behind it would drop or skip what newer models
 * declare; one ahead of it would apply a schema the branch does not have yet.
 *
 * Returns why the checkout is refused, or `undefined` when it may run.
 */
export const checkCheckout = ({
  environment,
  cwd = process.cwd(),
}: {
  environment: string;
  cwd?: string;
}): string | undefined => {
  const branch = readBranch({ environment, cwd });

  if (!branch) {
    return undefined;
  }

  const prefix = `DATABASE_GIT_BRANCH is "${branch}" for ${environment}`;

  try {
    git({ args: ['fetch', '--quiet', 'origin', branch], cwd });
  } catch (error) {
    // execFileSync's message carries git's stderr.
    return `${prefix}, but fetching origin/${branch} failed: ${(error as Error).message.trim()}`;
  }

  // Untracked files are left out: a model only reaches the bundle through a
  // tracked import, and that import would show here as a modified file.
  if (git({ args: ['status', '--porcelain', '--untracked-files=no'], cwd })) {
    return `${prefix}, but the working tree has uncommitted changes. Commit or stash them first.`;
  }

  const head = git({ args: ['rev-parse', 'HEAD'], cwd });
  const remote = git({ args: ['rev-parse', 'FETCH_HEAD'], cwd });

  if (head === remote) {
    return undefined;
  }

  let isBehind = true;

  try {
    git({ args: ['merge-base', '--is-ancestor', 'HEAD', 'FETCH_HEAD'], cwd });
  } catch {
    isBehind = false;
  }

  return isBehind
    ? `${prefix}, but HEAD (${head.slice(0, 7)}) is behind origin/${branch} (${remote.slice(0, 7)}). Pull first.`
    : `${prefix}, but HEAD (${head.slice(0, 7)}) is not origin/${branch} (${remote.slice(0, 7)}). Check out origin/${branch} first.`;
};
