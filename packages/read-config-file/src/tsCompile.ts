/**
 * Thanks to https://github.com/mighdoll/config-file-ts
 */
import { glob } from 'glob';
import fs from 'node:fs';
import importSync from 'import-sync';
import os, { platform } from 'node:os';
import path from 'node:path';
import ts from 'typescript';

export interface CompileResult {
  localSources: string[];
  compiled: boolean;
}

const fsRoot = path.parse(process.cwd()).root;

const tsCompile = (
  fileNames: string[],
  options: ts.CompilerOptions
): CompileResult => {
  const program = ts.createProgram(fileNames, options);

  const sources = program
    .getSourceFiles()
    .map((f) => {
      return f.fileName;
    })
    .filter((name) => {
      return !name.includes('node_modules');
    });

  const emitResult = program.emit();

  return { localSources: sources, compiled: !emitResult.emitSkipped };
};

/** @return the directory that will be used to store transpilation output. */
export const defaultOutDir = (
  tsFile: string,
  programName: string = 'config-file-ts'
): string => {
  const tsPath = path.resolve(tsFile);
  let smushedPath = tsPath.split(path.sep).join('-').slice(1);
  if (platform() === 'win32') {
    smushedPath = smushedPath.replace(/^:/, '');
  }
  return path.join(os.homedir(), '.cache', programName, smushedPath);
};

const sourcesFile = (outDir: string): string => {
  return path.join(outDir, '_sources');
};

/** local sources used in last compilation, including imports */
const extendedSources = (outDir: string): string[] => {
  const file = sourcesFile(outDir);
  if (!fs.existsSync(file)) {
    return [];
  }
  const lines = fs.readFileSync(file, 'utf8');
  return lines.split('\n');
};

const saveExtendedSources = (outDir: string, allSources: string[]): void => {
  const file = sourcesFile(outDir);
  fs.writeFileSync(file, allSources.join('\n'));
};

const changeSuffix = (filePath: string, suffix: string): string => {
  const dir = path.dirname(filePath);
  const curSuffix = path.extname(filePath);
  const base = path.basename(filePath, curSuffix);
  return path.join(dir, base + suffix);
};

/** @return path to the js file that will be produced by typescript compilation */
export const jsOutFile = (tsFile: string, outDir: string): string => {
  const tsAbsolutePath = path.resolve(tsFile);
  const tsAbsoluteDir = path.dirname(tsAbsolutePath);
  const dirFromRoot = path.relative(fsRoot, tsAbsoluteDir);
  const jsDir = path.join(outDir, dirFromRoot);
  const outFile = changeSuffix(path.basename(tsFile), '.js');
  return path.join(jsDir, outFile);
};

const compilationPairs = (
  srcFiles: string[],
  outDir: string
): [string, string][] => {
  return srcFiles.map((tsFile) => {
    return [tsFile, jsOutFile(tsFile, outDir)];
  });
};

const anyOutDated = (filePairs: [string, string][]): boolean => {
  const found = filePairs.find(([srcPath, outPath]) => {
    if (!fs.existsSync(outPath)) {
      return true;
    }
    const srcTime = fs.statSync(srcPath).mtime;
    const outTime = fs.statSync(outPath).mtime;
    return srcTime > outTime;
  });

  return found !== undefined;
};

/** Return true if any files need compiling */
const needsCompile = (srcGlobs: string[], outDir: string): boolean => {
  const files = srcGlobs.flatMap((src) => {
    return glob.sync(src);
  });
  const srcDestPairs = compilationPairs(files, outDir);
  return anyOutDated(srcDestPairs);
};

export const nearestNodeModules = (dir: string): string | undefined => {
  const resolvedDir = path.resolve(dir);
  const modulesFile = path.join(resolvedDir, 'node_modules');

  if (fs.existsSync(modulesFile)) {
    return modulesFile;
  } else {
    const { dir: parent, root } = path.parse(resolvedDir);
    if (parent !== root) {
      return nearestNodeModules(parent);
    } else {
      return undefined;
    }
  }
};

/** create a symlink, replacing any existing linkfile */
export const symLinkForce = (existing: string, link: string): void => {
  if (fs.existsSync(link)) {
    if (!fs.lstatSync(link).isSymbolicLink()) {
      throw `symLinkForce refusing to unlink non-symlink ${link}`;
    }
    fs.unlinkSync(link);
  }
  fs.symlinkSync(existing, link);
};

/** Put a link in the output directory to node_modules.
 */
const linkNodeModules = (outDir: string): void => {
  /*
   * Note that this only puts a link to the single node_modules directory
   * that's closest by.
   *
   * But I think node's module resolution will search multiple
   * parent directories for multiple node_modules at runtime. So just one
   * node_modules link may be insufficient in some complicated cases.
   *
   * If supporting the more complicated case is worthwhile, we can consider
   * e.g. encoding a full list of node_modules and setting NODE_PATH instead
   * of the symlink approach here.
   */
  const nodeModules = nearestNodeModules(process.cwd());
  if (nodeModules) {
    const linkToModules = path.join(outDir, 'node_modules');
    symLinkForce(nodeModules, linkToModules);
  }
};

export const compileIfNecessary = (
  sources: string[],
  outDir: string,
  strict = true
): boolean => {
  const sourceSet = new Set([...sources, ...extendedSources(outDir)]);
  const allSources = [...sourceSet];
  if (needsCompile(allSources, outDir)) {
    const { compiled, localSources } = tsCompile(sources, {
      outDir,
      rootDir: fsRoot,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      esModuleInterop: true,
      resolveJsonModule: true,
      skipLibCheck: true,
      strict,
      target: ts.ScriptTarget.ES2021,
      noImplicitAny: false,
      noEmitOnError: true,
    });

    if (compiled) {
      saveExtendedSources(outDir, localSources);
      linkNodeModules(outDir);
    }

    return compiled;
  }

  return true;
};

/**
 * Compile a typescript config file to js if necessary (if the js
 * file doesn't exist or is older than the typescript file).
 *
 * @param tsFile path to ts config file
 * @param outDir directory to place the compiled js file
 * @returns the path to the compiled javascript config file,
 *   or undefined if the compilation fails.
 */
export const compileConfigIfNecessary = (
  tsFile: string,
  outDir: string,
  strict = true
): string | undefined => {
  if (!fs.existsSync(tsFile)) {
    // eslint-disable-next-line no-console
    console.error('config file:', tsFile, ' not found');
    return undefined;
  }

  const success = compileIfNecessary([tsFile], outDir, strict);
  if (!success) {
    return undefined;
  }

  return jsOutFile(tsFile, outDir);
};

export const loadTsConfig = <T>(
  tsFile: string,
  outDir?: string | undefined,
  strict = true
): T | undefined => {
  const realOutDir = outDir || defaultOutDir(tsFile);
  const jsConfig = compileConfigIfNecessary(tsFile, realOutDir, strict);

  if (!jsConfig) {
    return undefined;
  }

  const end = jsConfig.length - path.extname(jsConfig).length;
  const requirePath = jsConfig.slice(0, end);

  try {
    const config = importSync(requirePath);

    return config.default;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('failed to load config file:', jsConfig, error);
    throw error;
  }
};
