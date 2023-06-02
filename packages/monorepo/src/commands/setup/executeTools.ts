import * as fs from 'fs';
import * as path from 'path';
import { type SetupOptions } from './setupOptions';
import { spawn } from '../../spawn';

export type ToolExecutionInput = {
  packages?: string[];
  configFiles?: {
    name: string;
    content: string;
  }[];
  scripts?: Record<string, string>;
  afterCommands?: string[];
  beforeCommands?: string[];
  huskyHooks?: [string, string][];
};

export type Tool = (options: SetupOptions) => Promise<ToolExecutionInput>;

export const executeCommand = (command: string) => {
  const [commandName, ...commandArgs] = command.split(' ');
  return spawn(commandName, commandArgs);
};

const configureRootPackagesJson = ({
  scripts,
  options,
}: {
  scripts: Record<string, string>;
  options: SetupOptions;
}) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  if (options.force) {
    delete packageJson.dependencies;
    delete packageJson.devDependencies;
    delete packageJson.peerDependencies;
  }

  /**
   * Remove prepare script because it will be added by husky.
   */
  delete packageJson.scripts.prepare;

  packageJson.private = true;

  if (options.force) {
    packageJson.scripts = {
      ...packageJson.scripts,
      ...scripts,
    };
  } else {
    packageJson.scripts = {
      ...scripts,
      ...packageJson.scripts,
    };
  }

  packageJson.engines = {
    ...packageJson.engines,
    node: '^18.0.0',
    pnpm: '>=8.6.0',
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

export const executeTools = async ({
  options,
  tools,
}: {
  options: SetupOptions;
  tools: Tool[];
}) => {
  const toolsExecutionInputs = await Promise.all(
    tools.map(async (tool) => {
      return await tool(options);
    })
  );

  /**
   * Execute before commands
   */
  toolsExecutionInputs.forEach((toolExecutionInput) => {
    toolExecutionInput?.beforeCommands?.forEach((command) => {
      executeCommand(command);
    });
  });

  /**
   * Save config files
   */
  toolsExecutionInputs.forEach((toolExecutionInput) => {
    toolExecutionInput?.configFiles?.forEach((configFile) => {
      /**
       * Check if file exists and do nothing if exists if force option is not set.
       */
      if (fs.existsSync(path.join(process.cwd(), configFile.name))) {
        if (!options.force) {
          return;
        }
      }

      /**
       * Create folders if not exists
       */
      const pathParts = configFile.name.split('/');

      if (pathParts.length > 1) {
        pathParts.pop();
        const folderPath = path.join(process.cwd(), ...pathParts);
        fs.mkdirSync(folderPath, { recursive: true });
      }

      fs.writeFileSync(
        path.join(process.cwd(), configFile.name),
        configFile.content.trim()
      );
    });
  });

  /**
   * Configure root package.json
   */
  const scripts = toolsExecutionInputs.reduce<Record<string, string>>(
    (acc, toolExecutionInput) => {
      return { ...acc, ...toolExecutionInput.scripts };
    },
    {}
  );
  configureRootPackagesJson({ scripts, options });

  /**
   * Install packages
   */
  spawn('pnpm', ['install']);

  const packages = toolsExecutionInputs
    .map((tool) => {
      return tool?.packages || [];
    })
    .flat()
    // eslint-disable-next-line max-params
    .filter((value, index, self) => {
      /**
       * Remove duplicates
       */
      return self.indexOf(value) === index;
    });

  spawn('pnpm', ['add', '-Dw', ...packages]);

  /**
   * Add husky hooks
   */
  spawn('npx', ['husky', 'install']);

  toolsExecutionInputs.forEach((toolExecutionInput) => {
    toolExecutionInput?.huskyHooks?.forEach(([hookName, command]) => {
      spawn('npx', ['husky', 'add', `.husky/${hookName}`, command]);
    });
  });

  /**
   * Execute after commands
   */
  toolsExecutionInputs.forEach((toolExecutionInput) => {
    toolExecutionInput?.afterCommands?.forEach((command) => {
      executeCommand(command);
    });
  });
};
