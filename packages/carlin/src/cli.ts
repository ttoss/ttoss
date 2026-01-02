/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
import 'dotenv/config';

import { AWS_DEFAULT_REGION, NAME } from './config';
import { EnvironmentVariables, setEnvVar } from './utils';
import { constantCase, kebabCase, camelCase } from 'change-case';
import { readConfigFileSync } from '@ttoss/read-config-file';
import { Command } from 'commander';
import AWS from 'aws-sdk';
import deepEqual from 'deep-equal';
import deepMerge from 'deepmerge';
import findUpSync from 'findup-sync';
import path from 'path';
import fs from 'fs';

/**
 * All config files merged. Used for environment overrides detection.
 */
let finalConfig: any = {};

/**
 * Tracks which options were explicitly set via CLI
 */
let cliProvidedOptions: Set<string> = new Set();

/**
 * Tracks default values for options
 */
let optionDefaults: Record<string, any> = {};

const coerceSetEnvVar = (env: EnvironmentVariables) => {
  return (value: any) => {
    setEnvVar(env, value);
    return value;
  };
};

export const options = {
  branch: {
    coerce: coerceSetEnvVar('BRANCH'),
    require: false,
    type: 'string',
  },
  config: {
    alias: 'c',
    describe:
      'Path to config file. You can create a config file and set all options there. Valid extensions: .js, .json, .ts, .yml, or .yaml.',
    require: false,
    type: 'string',
  },
  environment: {
    alias: ['e', 'env'],
    coerce: coerceSetEnvVar('ENVIRONMENT'),
    type: 'string',
  },
  environments: {},
  project: {
    coerce: coerceSetEnvVar('PROJECT'),
    require: false,
    type: 'string',
  },
  region: {
    alias: 'r',
    default: AWS_DEFAULT_REGION,
    describe: 'AWS region.',
    type: 'string',
  },
} as const;

/**
 * Get environment variable prefix (CARLIN)
 */
const getEnvPrefix = () => {
  return constantCase(NAME);
};

/**
 * Load config from package.json "carlin" property
 */
const getPkgConfig = (): Record<string, any> => {
  try {
    const pkgPath = findUpSync('package.json', { cwd: process.cwd() });
    if (pkgPath) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      return pkg[NAME] || {};
    }
  } catch {
    // Ignore errors
  }
  return {};
};

/**
 * Load configs from carlin config files (carlin.ts, carlin.js, carlin.yml, etc.)
 * Searches up the directory tree and merges all found configs.
 */
const getConfigFromFiles = (): Record<string, any> => {
  const names = ['ts', 'js', 'yml', 'yaml', 'json'].map((ext) => {
    return `${NAME}.${ext}`;
  });
  const paths: string[] = [];
  let currentPath = process.cwd();
  let findUpPath: string | null;

  do {
    findUpPath = findUpSync(names, { cwd: currentPath });
    if (findUpPath) {
      currentPath = path.resolve(findUpPath, '../..');
      paths.push(findUpPath);
    }
  } while (findUpPath);

  const configs = paths.map((p) => {
    return readConfigFileSync({ configFilePath: p }) || {};
  });

  /**
   * Using configs.reverse() to get the most far config first. This way the
   * nearest configs will replace others.
   */
  return deepMerge.all(configs.reverse()) as Record<string, any>;
};

/**
 * Get options from environment variables with CARLIN_ prefix
 */
const getEnvOptions = (): Record<string, any> => {
  const prefix = getEnvPrefix();
  const envOptions: Record<string, any> = {};

  Object.keys(process.env).forEach((key) => {
    if (key.startsWith(`${prefix}_`)) {
      const optionName = camelCase(key.substring(prefix.length + 1));
      envOptions[optionName] = process.env[key];
    }
  });

  return envOptions;
};

/**
 * Handle environment-specific configuration overrides.
 * Values from environments[currentEnvironment] are merged into options,
 * but CLI-provided options take precedence.
 */
const handleEnvironments = (opts: any): any => {
  const { environment, environments } = opts;

  if (environment && environments && environments[environment]) {
    Object.entries(environments[environment]).forEach(([key, value]) => {
      const kebabCaseKey = kebabCase(key);

      /**
       * Only override if:
       * 1. The option was not explicitly provided via CLI
       * 2. The current value equals the config file value (not from CLI)
       */
      const isKeyFromCli = cliProvidedOptions.has(key) ||
        cliProvidedOptions.has(kebabCaseKey);

      const isDefault = optionDefaults[key] !== undefined &&
        deepEqual(opts[key], optionDefaults[key]);

      const isFromConfigFile = deepEqual(opts[key], finalConfig[key]);

      if (!isKeyFromCli && (isDefault || isFromConfigFile)) {
        opts[key] = value;
      }
    });
  }

  return opts;
};

/**
 * Apply coerce functions to options
 */
const applyCoerceFunctions = (opts: any): any => {
  if (opts.branch !== undefined && options.branch.coerce) {
    options.branch.coerce(opts.branch);
  }
  if (opts.environment !== undefined && options.environment.coerce) {
    options.environment.coerce(opts.environment);
  }
  if (opts.project !== undefined && options.project.coerce) {
    options.project.coerce(opts.project);
  }
  return opts;
};

/**
 * Merge all configuration sources with proper precedence:
 * 1. CLI arguments (highest)
 * 2. Environment variables (CARLIN_*)
 * 3. Config file specified via --config
 * 4. Auto-discovered config files (carlin.yml, etc.)
 * 5. package.json "carlin" property
 * 6. Default values (lowest)
 */
const mergeAllConfigs = (
  cliOpts: Record<string, any>,
  command: Command
): Record<string, any> => {
  // Track which options were set via CLI
  cliProvidedOptions = new Set();
  command.options.forEach((opt) => {
    const name = opt.attributeName();
    const value = cliOpts[name];
    // Check if the value was explicitly provided
    if (value !== undefined && !opt.defaultValue) {
      cliProvidedOptions.add(name);
    } else if (value !== undefined && value !== opt.defaultValue) {
      cliProvidedOptions.add(name);
    }
  });

  // Record default values
  optionDefaults = {};
  command.options.forEach((opt) => {
    if (opt.defaultValue !== undefined) {
      optionDefaults[opt.attributeName()] = opt.defaultValue;
    }
  });

  // Get configs from various sources
  const pkgConfig = getPkgConfig();
  const fileConfig = getConfigFromFiles();
  const envConfig = getEnvOptions();

  // Load config from --config option if provided
  let customConfig = {};
  if (cliOpts.config) {
    try {
      customConfig = readConfigFileSync({ configFilePath: cliOpts.config }) || {};
    } catch {
      // Ignore errors
    }
  }

  // Store finalConfig for environment handling
  finalConfig = deepMerge.all([pkgConfig, fileConfig, customConfig]) as Record<string, any>;

  // Merge with precedence (later sources override earlier)
  const merged = deepMerge.all([
    optionDefaults,
    pkgConfig,
    fileConfig,
    customConfig,
    envConfig,
    cliOpts,
  ]) as Record<string, any>;

  return merged;
};

/**
 * Middleware-like hooks that run before command execution
 */
const runMiddleware = (opts: any): any => {
  // Handle process.env.ENVIRONMENT fallback
  const finalEnvironment = opts.environment || process.env.ENVIRONMENT;
  if (finalEnvironment) {
    setEnvVar('ENVIRONMENT', finalEnvironment);
    opts.environment = finalEnvironment;
    opts.e = finalEnvironment;
    opts.env = finalEnvironment;
  }

  // Handle environments configuration
  opts = handleEnvironments(opts);

  // Validate environment type
  if (!['string', 'undefined'].includes(typeof opts.environment)) {
    throw new Error(
      `environment type is invalid. The value: ${JSON.stringify(opts.environment)}`
    );
  }

  // Set AWS region
  if (opts.region) {
    AWS.config.region = opts.region;
    setEnvVar('REGION', opts.region);
  }

  // Apply coerce functions
  opts = applyCoerceFunctions(opts);

  return opts;
};

/**
 * Create a hook that processes options before command execution
 */
const createPreActionHook = (_program: Command) => {
  return (thisCommand: Command) => {
    const opts = thisCommand.opts();
    const processedOpts = mergeAllConfigs(opts, thisCommand);
    const finalOpts = runMiddleware(processedOpts);

    // Update command options with processed values
    Object.entries(finalOpts).forEach(([key, value]) => {
      thisCommand.setOptionValue(key, value);
    });
  };
};

/**
 * Add common options to a command
 */
const addCommonOptions = (cmd: Command): Command => {
  cmd
    .option('--branch <branch>', 'Git branch name')
    .option('-c, --config <path>', options.config.describe)
    .option(
      '-e, --environment <environment>',
      'Environment name (e.g., Production, Staging)'
    )
    .option('--environments <environments>', 'Environment configurations')
    .option('--project <project>', 'Project name')
    .option(
      `-r, --region <region>`,
      options.region.describe,
      AWS_DEFAULT_REGION
    );

  return cmd;
};

// Import commands - these will be updated to use commander
import { deployCommand } from './deploy/command';
import { ecsTaskReportCommand } from './deploy/cicd/ecsTaskReportCommand';
import { generateEnvCommand } from './generateEnv/generateEnvCommand';

/**
 * Create and configure the CLI program.
 * This function returns a yargs-compatible interface for backward compatibility
 * while using commander internally.
 */
export const cli = () => {
  const program = new Command();

  program
    .name(NAME)
    .description('Carlin - Cloud deployment and infrastructure management')
    .version('1.39.11')
    .allowUnknownOption(true)
    .allowExcessArguments(true);

  // Add common options
  addCommonOptions(program);

  // Add pre-action hook for option processing
  program.hook('preAction', createPreActionHook(program));

  // print-args command (hidden, for testing)
  program
    .command('print-args')
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action(function (this: Command) {
      const opts = this.parent?.opts() || {};
      const processedOpts = mergeAllConfigs(opts, this.parent!);
      const finalOpts = runMiddleware(processedOpts);
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ ...finalOpts, _: this.args }, null, 2));
    });

  // Add deploy command
  program.addCommand(deployCommand);

  // Add generate-env command with aliases
  program.addCommand(generateEnvCommand);

  // Add cicd-ecs-task-report command
  program.addCommand(ecsTaskReportCommand);

  // Add help epilogue
  program.addHelpText(
    'after',
    '\nFor more information, read our docs at https://ttoss.dev/docs/carlin/'
  );

  /**
   * Return a yargs-compatible interface for backward compatibility with tests.
   * This allows existing tests to work without modification.
   */
  return {
    /**
     * Parse command line arguments
     */
    parse: (args?: string | string[], context?: Record<string, any>) => {
      return new Promise((resolve, reject) => {
        try {
          // Normalize args
          let argv: string[];
          if (typeof args === 'string') {
            argv = args.split(' ').filter(Boolean);
          } else if (Array.isArray(args)) {
            argv = args;
          } else {
            argv = process.argv.slice(2);
          }

          // If context is provided, merge it with the options
          if (context) {
            // Convert context to CLI args format for commander
            Object.entries(context).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                const kebabKey = kebabCase(key);
                if (typeof value === 'boolean') {
                  if (value) {
                    argv.push(`--${kebabKey}`);
                  }
                } else if (Array.isArray(value)) {
                  value.forEach((v: any) => {
                    if (typeof v === 'object') {
                      argv.push(`--${kebabKey}`, JSON.stringify(v));
                    } else {
                      argv.push(`--${kebabKey}`, String(v));
                    }
                  });
                } else if (typeof value === 'object') {
                  argv.push(`--${kebabKey}`, JSON.stringify(value));
                } else {
                  argv.push(`--${kebabKey}=${value}`);
                }
              }
            });
          }

          // Store result for resolution
          let result: any = {};

          // Override command actions to capture results
          const originalAction = program.commands.find(
            (c) => c.name() === 'print-args'
          );
          if (originalAction) {
            const printArgsCmd = program.commands.find(
              (c) => c.name() === 'print-args'
            );
            if (printArgsCmd) {
              printArgsCmd.action(function (this: Command) {
                const opts = this.parent?.opts() || {};
                const allOpts = { ...context, ...opts };
                const processedOpts = mergeAllConfigs(allOpts, this.parent!);
                const finalOpts = runMiddleware(processedOpts);
                result = {
                  ...finalOpts,
                  _: [argv[0]].filter(Boolean),
                };
                resolve(result);
              });
            }
          }

          // Parse and get result
          program.parseAsync(argv, { from: 'user' }).then(() => {
            if (Object.keys(result).length === 0) {
              // Command didn't set result, return parsed options
              const opts = program.opts();
              const allOpts = { ...context, ...opts };
              result = {
                ...allOpts,
                _: argv.slice(0, 1),
              };
              resolve(result);
            }
          }).catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    },

    /**
     * Disable strict mode (for compatibility)
     */
    strict: (enabled?: boolean) => {
      if (enabled === false) {
        program.allowUnknownOption(true);
        program.allowExcessArguments(true);
      }
      return cli();
    },
  };
};

