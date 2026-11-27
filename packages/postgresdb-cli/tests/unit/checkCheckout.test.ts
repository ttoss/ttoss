import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';

import { checkCheckout } from 'src/checkCheckout';

const gitEnv = {
  ...process.env,
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@example.com',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@example.com',
};

const git = ({ args, cwd }: { args: string[]; cwd: string }) => {
  return execFileSync('git', args, { cwd, env: gitEnv, stdio: 'pipe' });
};

const commit = ({ cwd, file }: { cwd: string; file: string }) => {
  fs.writeFileSync(path.join(cwd, file), file);
  git({ args: ['add', file], cwd });
  git({ args: ['commit', '--quiet', '-m', file], cwd });
};

let root: string;
let remote: string;
let checkout: string;
let pusher: string;

/**
 * A bare `origin`, the checkout under test and a second clone that pushes
 * commits the checkout has not pulled.
 */
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-checkout-'));
  remote = path.join(root, 'remote.git');
  checkout = path.join(root, 'checkout');
  pusher = path.join(root, 'pusher');

  git({ args: ['init', '--quiet', '--bare', '-b', 'main', remote], cwd: root });
  git({ args: ['clone', '--quiet', remote, checkout], cwd: root });
  commit({ cwd: checkout, file: 'models.ts' });
  git({ args: ['push', '--quiet', 'origin', 'main'], cwd: checkout });
  git({ args: ['clone', '--quiet', remote, pusher], cwd: root });

  fs.writeFileSync(
    path.join(checkout, '.env.Production'),
    'DATABASE_GIT_BRANCH=main\n'
  );
  fs.writeFileSync(path.join(checkout, '.git', 'info', 'exclude'), '.env.*\n');
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
  delete process.env.DATABASE_GIT_BRANCH;
});

test('allows any checkout when the environment sets no branch', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'no-git-'));

  expect(checkCheckout({ environment: 'Production', cwd })).toBeUndefined();

  fs.rmSync(cwd, { recursive: true, force: true });
});

test('defaults to the current directory', () => {
  expect(checkCheckout({ environment: 'Production' })).toBeUndefined();
});

test('allows a clean checkout at origin/<branch>', () => {
  expect(
    checkCheckout({ environment: 'Production', cwd: checkout })
  ).toBeUndefined();
});

test('allows untracked files', () => {
  fs.writeFileSync(path.join(checkout, 'scratch.ts'), '');

  expect(
    checkCheckout({ environment: 'Production', cwd: checkout })
  ).toBeUndefined();
});

test('refuses a checkout behind origin/<branch>', () => {
  commit({ cwd: pusher, file: 'newer-models.ts' });
  git({ args: ['push', '--quiet', 'origin', 'main'], cwd: pusher });

  expect(checkCheckout({ environment: 'Production', cwd: checkout })).toMatch(
    /^DATABASE_GIT_BRANCH is "main" for Production, but HEAD \(\w{7}\) is behind origin\/main \(\w{7}\)\. Pull first\.$/
  );
});

test('refuses a checkout with commits origin/<branch> does not have', () => {
  git({ args: ['checkout', '--quiet', '-b', 'feature'], cwd: checkout });
  commit({ cwd: checkout, file: 'feature-models.ts' });

  expect(checkCheckout({ environment: 'Production', cwd: checkout })).toMatch(
    /is not origin\/main \(\w{7}\)\. Check out origin\/main first\.$/
  );
});

test('refuses uncommitted changes to tracked files', () => {
  fs.writeFileSync(path.join(checkout, 'models.ts'), 'edited');

  expect(checkCheckout({ environment: 'Production', cwd: checkout })).toBe(
    'DATABASE_GIT_BRANCH is "main" for Production, but the working tree has uncommitted changes. Commit or stash them first.'
  );
});

test('refuses when origin/<branch> cannot be fetched', () => {
  fs.writeFileSync(
    path.join(checkout, '.env.Production'),
    'DATABASE_GIT_BRANCH=does-not-exist\n'
  );

  expect(checkCheckout({ environment: 'Production', cwd: checkout })).toMatch(
    /^DATABASE_GIT_BRANCH is "does-not-exist" for Production, but fetching origin\/does-not-exist failed: .+/
  );
});

test('reads the branch from the process environment without an env file', () => {
  process.env.DATABASE_GIT_BRANCH = 'main';
  commit({ cwd: pusher, file: 'newer-models.ts' });
  git({ args: ['push', '--quiet', 'origin', 'main'], cwd: pusher });

  expect(checkCheckout({ environment: 'Staging', cwd: checkout })).toMatch(
    /is behind origin\/main/
  );
});
