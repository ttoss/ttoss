import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import {
  getPackages,
  getTypedocOptions,
  websiteDir,
} from './typedoc-packages.mts';

/**
 * Generates the per-package TypeDoc API docs under `docs/modules/packages/**`.
 *
 * Previously each package was documented by a `docusaurus-plugin-typedoc`
 * instance running inside the single `docusaurus build` process, which made the
 * build's peak memory grow with the number of packages and eventually hit the
 * Node heap cap (OOM). This script decouples that work: TypeDoc runs once per
 * package in its own child process, so each process returns its memory to the
 * OS on exit and peak memory becomes `max(single package)` instead of
 * `sum(all packages)`.
 *
 * The script has two modes:
 *
 * - orchestrator (default): discovers the packages and spawns one worker child
 *   process per package, with bounded concurrency.
 * - worker (`--package=<name>`): runs TypeDoc for a single package and exits.
 */

const PACKAGE_FLAG = '--package=';

/**
 * Runs TypeDoc for a single package, mirroring what `docusaurus-plugin-typedoc`
 * did internally (`Application.bootstrapWithPlugins` with the markdown +
 * docusaurus theme plugins, then `convert` + `generateOutputs`).
 */
const generatePackage = async (pkg: string): Promise<void> => {
  const typedoc = await import('typedoc');

  const options = getTypedocOptions(pkg);

  const app = await typedoc.Application.bootstrapWithPlugins(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options as any,
    [
      new typedoc.TypeDocReader(),
      new typedoc.PackageJsonReader(),
      new typedoc.TSConfigReader(),
    ]
  );

  const project = await app.convert();

  if (!project) {
    throw new Error(`TypeDoc failed to convert package "${pkg}".`);
  }

  await app.generateOutputs(project);
};

/**
 * Spawns a worker child process for a single package and resolves when it
 * exits. Each worker runs in its own process so its memory is released on exit.
 */
const runWorker = (pkg: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [
        path.resolve(import.meta.dirname, 'generate-api-docs.mts'),
        `${PACKAGE_FLAG}${pkg}`,
      ],
      {
        cwd: websiteDir,
        stdio: 'inherit',
        env: process.env,
      }
    );

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`API doc generation for "${pkg}" exited with code ${code}.`)
      );
    });
  });
};

/**
 * Runs the worker for each package with a bounded number running concurrently.
 */
const runWithConcurrency = async (
  pkgs: string[],
  concurrency: number
): Promise<void> => {
  const queue = [...pkgs];
  const failures: string[] = [];

  const worker = async (): Promise<void> => {
    for (let pkg = queue.shift(); pkg; pkg = queue.shift()) {
      // eslint-disable-next-line no-console
      console.log(`[typedoc] generating API docs for ${pkg}`);

      try {
        await runWorker(pkg);
      } catch (error) {
        failures.push(pkg);
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, pkgs.length) }, () => {
      return worker();
    })
  );

  if (failures.length > 0) {
    throw new Error(`API doc generation failed for: ${failures.join(', ')}.`);
  }
};

const orchestrate = async (): Promise<void> => {
  // TypeDoc generation is skipped entirely in development, matching the
  // previous behavior where the typedoc plugins were not registered.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(
      '[typedoc] NODE_ENV=development — skipping API doc generation.'
    );
    return;
  }

  const pkgs = getPackages();

  // Each worker runs a full TypeScript program, so keep concurrency modest to
  // bound peak memory while still parallelizing across CPUs.
  const concurrency = Math.max(1, Math.min(4, os.cpus().length - 1));

  // eslint-disable-next-line no-console
  console.log(
    `[typedoc] generating API docs for ${pkgs.length} packages (concurrency ${concurrency})`
  );

  await runWithConcurrency(pkgs, concurrency);

  // eslint-disable-next-line no-console
  console.log('[typedoc] API doc generation complete.');
};

const main = async (): Promise<void> => {
  const packageArg = process.argv.find((arg) => {
    return arg.startsWith(PACKAGE_FLAG);
  });

  if (packageArg) {
    await generatePackage(packageArg.slice(PACKAGE_FLAG.length));
    return;
  }

  await orchestrate();
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
