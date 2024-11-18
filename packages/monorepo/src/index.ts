import { Plop, run } from 'plop';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import minimist from 'minimist';
import path from 'node:path';

const args = process.argv.slice(2);
const argv = minimist(args);

const __dirname = dirname(fileURLToPath(import.meta.url));

Plop.prepare(
  {
    cwd: argv.cwd,
    configPath: path.join(__dirname, 'plopfile.js'),
    preload: argv.preload || [],
    completion: argv.completion,
  },
  (env) => {
    return Plop.execute(env, (env, argv) => {
      const passArgsBeforeDashes = false;
      return run(env, argv, passArgsBeforeDashes);
    });
  }
);
