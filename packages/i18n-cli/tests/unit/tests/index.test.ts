import fs from 'node:fs';
import path from 'node:path';

import { compile, extract } from '@formatjs/cli-lib';
import fg from 'fast-glob';
import {
  analyzeMissingAndUnusedTranslations,
  compareTranslations,
  compileTranslations,
  executeI18nCli,
  extractTranslationsFromSource,
  getI18nConfig,
  getTtossExtractedTranslations,
  writeCleanTranslations,
  writeFinalExtractedData,
  writeMissingTranslations,
  writeUnusedTranslations,
} from 'src/index';

// Mock filesystem operations
jest.mock('node:fs', () => {
  return {
    promises: {
      writeFile: jest.fn(),
      readFile: jest.fn(),
      mkdir: jest.fn(),
    },
    readFileSync: jest.fn(),
  };
});

jest.mock('fast-glob', () => {
  return {
    sync: jest.fn(),
  };
});

jest.mock('@formatjs/cli-lib', () => {
  return {
    extract: jest.fn(),
    compile: jest.fn(),
  };
});

const mockWriteFile = jest.mocked(fs.promises.writeFile);
const mockReadFile = jest.mocked(fs.promises.readFile);
const mockMkdir = jest.mocked(fs.promises.mkdir);
const mockReadFileSync = jest.mocked(fs.readFileSync);
const mockPathJoin = jest.spyOn(path, 'join');
const mockFgSync = jest.mocked(fg.sync);
const mockExtract = jest.mocked(extract);
const mockCompile = jest.mocked(compile);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('i18n-cli', () => {
  describe('getI18nConfig', () => {
    test('should return correct default configuration paths', () => {
      // Arrange & Act
      const config = getI18nConfig();

      // Assert
      expect(config).toEqual({
        defaultDir: 'i18n',
        extractDir: 'i18n/lang',
        extractFile: 'i18n/lang/en.json',
        compileDir: 'i18n/compiled',
        missingDir: 'i18n/missing',
        unusedDir: 'i18n/unused',
      });
    });

    test('should return consistent configuration on multiple calls', () => {
      // Arrange & Act
      const config1 = getI18nConfig();
      const config2 = getI18nConfig();

      // Assert
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different objects
    });

    test('should have all required properties', () => {
      // Arrange & Act
      const config = getI18nConfig();

      // Assert
      expect(config).toHaveProperty('defaultDir');
      expect(config).toHaveProperty('extractDir');
      expect(config).toHaveProperty('extractFile');
      expect(config).toHaveProperty('compileDir');
      expect(config).toHaveProperty('missingDir');
      expect(config).toHaveProperty('unusedDir');
    });

    test('should have proper path structure for all directories', () => {
      // Arrange & Act
      const config = getI18nConfig();

      // Assert
      expect(config.extractDir).toContain(config.defaultDir);
      expect(config.compileDir).toContain(config.defaultDir);
      expect(config.missingDir).toContain(config.defaultDir);
      expect(config.unusedDir).toContain(config.defaultDir);
      expect(config.extractFile).toContain(config.extractDir);
      expect(config.extractFile).toMatch(/en\.json$/);
    });
  });

  describe('compareTranslations', () => {
    test('should identify missing translations', () => {
      // Arrange
      const extractedTranslations = {
        key1: { defaultMessage: 'Message 1' },
        key2: { defaultMessage: 'Message 2' },
        key3: { defaultMessage: 'Message 3' },
      };
      const translationData = {
        key1: { defaultMessage: 'Translated Message 1' },
        // key2 is missing
        // key3 is missing
      };

      // Act
      const result = compareTranslations(
        extractedTranslations,
        translationData
      );

      // Assert
      expect(result.missingTranslations).toEqual({
        key2: { defaultMessage: 'Message 2' },
        key3: { defaultMessage: 'Message 3' },
      });
    });

    test('should identify unused translations', () => {
      // Arrange
      const extractedTranslations = {
        key1: { defaultMessage: 'Message 1' },
      };
      const translationData = {
        key1: { defaultMessage: 'Translated Message 1' },
        unusedKey1: { defaultMessage: 'Unused Translation 1' },
        unusedKey2: { defaultMessage: 'Unused Translation 2' },
      };

      // Act
      const result = compareTranslations(
        extractedTranslations,
        translationData
      );

      // Assert
      expect(result.unusedTranslations).toEqual({
        unusedKey1: { defaultMessage: 'Unused Translation 1' },
        unusedKey2: { defaultMessage: 'Unused Translation 2' },
      });
    });

    test('should return clean translations (only valid ones)', () => {
      // Arrange
      const extractedTranslations = {
        key1: { defaultMessage: 'Message 1' },
        key2: { defaultMessage: 'Message 2' },
      };
      const translationData = {
        key1: { defaultMessage: 'Translated Message 1' },
        key2: { defaultMessage: 'Translated Message 2' },
        unusedKey: { defaultMessage: 'Unused Translation' },
      };

      // Act
      const result = compareTranslations(
        extractedTranslations,
        translationData
      );

      // Assert
      expect(result.cleanTranslations).toEqual({
        key1: { defaultMessage: 'Translated Message 1' },
        key2: { defaultMessage: 'Translated Message 2' },
      });
    });

    test('should handle empty extracted translations', () => {
      // Arrange
      const extractedTranslations = {};
      const translationData = {
        key1: { defaultMessage: 'Translation 1' },
        key2: { defaultMessage: 'Translation 2' },
      };

      // Act
      const result = compareTranslations(
        extractedTranslations,
        translationData
      );

      // Assert
      expect(result.missingTranslations).toEqual({});
      expect(result.unusedTranslations).toEqual(translationData);
      expect(result.cleanTranslations).toEqual({});
    });

    test('should handle empty translation data', () => {
      // Arrange
      const extractedTranslations = {
        key1: { defaultMessage: 'Message 1' },
        key2: { defaultMessage: 'Message 2' },
      };
      const translationData = {};

      // Act
      const result = compareTranslations(
        extractedTranslations,
        translationData
      );

      // Assert
      expect(result.missingTranslations).toEqual(extractedTranslations);
      expect(result.unusedTranslations).toEqual({});
      expect(result.cleanTranslations).toEqual({});
    });

    test('should handle complex translation objects with modules', () => {
      // Arrange
      const extractedTranslations = {
        key1: { defaultMessage: 'Message 1', module: '@ttoss/ui' },
        key2: { defaultMessage: 'Message 2', description: 'A description' },
      };
      const translationData = {
        key1: { defaultMessage: 'Translated Message 1' },
        unusedKey: { defaultMessage: 'Unused Translation' },
      };

      // Act
      const result = compareTranslations(
        extractedTranslations,
        translationData
      );

      // Assert
      expect(result.missingTranslations).toEqual({
        key2: { defaultMessage: 'Message 2', description: 'A description' },
      });
      expect(result.unusedTranslations).toEqual({
        unusedKey: { defaultMessage: 'Unused Translation' },
      });
      expect(result.cleanTranslations).toEqual({
        key1: { defaultMessage: 'Translated Message 1' },
      });
    });
  });

  describe('writeMissingTranslations', () => {
    test('should write missing translations to correct file', async () => {
      // Arrange
      const filename = 'pt.json';
      const missingTranslations = {
        key1: { defaultMessage: 'Message 1' },
        key2: { defaultMessage: 'Message 2' },
      };
      const config = getI18nConfig();
      const expectedPath = '/mock/path/missing/pt.json';
      const expectedContent = JSON.stringify(missingTranslations, undefined, 2);

      mockPathJoin.mockReturnValue(expectedPath);
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeMissingTranslations(filename, missingTranslations, config);

      // Assert
      expect(mockPathJoin).toHaveBeenCalledWith(config.missingDir, filename);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, expectedContent);
    });

    test('should handle empty missing translations', async () => {
      // Arrange
      const filename = 'pt.json';
      const missingTranslations = {};
      const config = getI18nConfig();
      const expectedPath = '/mock/path/missing/pt.json';
      const expectedContent = JSON.stringify({}, undefined, 2);

      mockPathJoin.mockReturnValue(expectedPath);
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeMissingTranslations(filename, missingTranslations, config);

      // Assert
      expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, expectedContent);
    });
  });

  describe('writeCleanTranslations', () => {
    test('should write clean translations to extract directory', async () => {
      // Arrange
      const filename = 'pt.json';
      const cleanTranslations = {
        key1: { defaultMessage: 'Clean Message 1' },
      };
      const config = getI18nConfig();
      const expectedPath = '/mock/path/extract/pt.json';
      const expectedContent = JSON.stringify(cleanTranslations, undefined, 2);

      mockPathJoin.mockReturnValue(expectedPath);
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeCleanTranslations(filename, cleanTranslations, config);

      // Assert
      expect(mockPathJoin).toHaveBeenCalledWith(config.extractDir, filename);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, expectedContent);
    });
  });

  describe('writeUnusedTranslations', () => {
    test('should write new unused translations when file does not exist', async () => {
      // Arrange
      const filename = 'pt.json';
      const unusedTranslations = {
        unused1: { defaultMessage: 'Unused 1' },
      };
      const config = getI18nConfig();
      const expectedPath = '/mock/path/unused/pt.json';
      const expectedContent = JSON.stringify(unusedTranslations, undefined, 2);

      mockPathJoin.mockReturnValue(expectedPath);
      mockReadFile.mockRejectedValue(new Error('File not found'));
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeUnusedTranslations(filename, unusedTranslations, config);

      // Assert
      expect(mockPathJoin).toHaveBeenCalledWith(config.unusedDir, filename);
      expect(mockReadFile).toHaveBeenCalledWith(expectedPath);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, expectedContent);
    });

    test('should merge with existing unused translations when file exists', async () => {
      // Arrange
      const filename = 'pt.json';
      const unusedTranslations = {
        unused2: { defaultMessage: 'Unused 2' },
      };
      const existingUnused = {
        unused1: { defaultMessage: 'Existing Unused 1' },
      };
      const config = getI18nConfig();
      const expectedPath = '/mock/path/unused/pt.json';
      const mergedTranslations = {
        ...existingUnused,
        ...unusedTranslations,
      };
      const expectedContent = JSON.stringify(mergedTranslations, undefined, 2);

      mockPathJoin.mockReturnValue(expectedPath);
      mockReadFile.mockResolvedValue(
        Buffer.from(JSON.stringify(existingUnused))
      );
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeUnusedTranslations(filename, unusedTranslations, config);

      // Assert
      expect(mockPathJoin).toHaveBeenCalledWith(config.unusedDir, filename);
      expect(mockReadFile).toHaveBeenCalledWith(expectedPath);
      expect(mockWriteFile).toHaveBeenCalledWith(expectedPath, expectedContent);
    });

    test('should handle empty existing unused translations', async () => {
      // Arrange
      const filename = 'pt.json';
      const unusedTranslations = {
        unused1: { defaultMessage: 'Unused 1' },
      };
      const config = getI18nConfig();
      const expectedPath = '/mock/path/unused/pt.json';

      mockPathJoin.mockReturnValue(expectedPath);
      mockReadFile.mockResolvedValue(Buffer.from(JSON.stringify({})));
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeUnusedTranslations(filename, unusedTranslations, config);

      // Assert
      expect(mockWriteFile).toHaveBeenCalledWith(
        expectedPath,
        JSON.stringify(unusedTranslations, undefined, 2)
      );
    });
  });

  describe('analyzeMissingAndUnusedTranslations', () => {
    test('should analyze multiple translation files correctly', async () => {
      // Arrange
      const finalExtractedData = JSON.stringify({
        key1: { defaultMessage: 'Message 1' },
        key2: { defaultMessage: 'Message 2' },
      });
      const config = getI18nConfig();

      const mockTranslationFiles = [
        '/mock/extract/pt.json',
        '/mock/extract/es.json',
      ];

      const ptTranslations = {
        key1: { defaultMessage: 'Mensagem 1' },
        unusedKey: { defaultMessage: 'Mensagem não usada' },
      };

      const esTranslations = {
        key2: { defaultMessage: 'Mensaje 2' },
      };

      // Setup mocks
      mockFgSync.mockReturnValue(mockTranslationFiles);
      mockMkdir.mockResolvedValue(undefined);
      mockPathJoin.mockImplementation((...paths) => {
        return paths.join('/');
      });

      mockReadFileSync
        .mockReturnValueOnce(JSON.stringify(ptTranslations))
        .mockReturnValueOnce(JSON.stringify(esTranslations));

      mockReadFile.mockRejectedValue(new Error('File not found')); // No existing unused files
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await analyzeMissingAndUnusedTranslations(finalExtractedData, config);

      // Assert
      expect(mockFgSync).toHaveBeenCalledWith('**/*.json', {
        cwd: config.extractDir,
        absolute: true,
      });
      expect(mockMkdir).toHaveBeenCalledWith(config.missingDir, {
        recursive: true,
      });
      expect(mockMkdir).toHaveBeenCalledWith(config.unusedDir, {
        recursive: true,
      });

      // Should write missing translations for pt.json (key2 is missing)
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('missing/pt.json'),
        JSON.stringify({ key2: { defaultMessage: 'Message 2' } }, undefined, 2)
      );

      // Should write missing translations for es.json (key1 is missing)
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('missing/es.json'),
        JSON.stringify({ key1: { defaultMessage: 'Message 1' } }, undefined, 2)
      );
    });

    test('should skip en.json file during analysis', async () => {
      // Arrange
      const finalExtractedData = JSON.stringify({
        key1: { defaultMessage: 'Message 1' },
      });
      const config = getI18nConfig();

      const mockTranslationFiles = [
        '/mock/extract/en.json',
        '/mock/extract/pt.json',
      ];

      mockFgSync.mockReturnValue(mockTranslationFiles);
      mockMkdir.mockResolvedValue(undefined);
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ key1: { defaultMessage: 'Mensagem 1' } })
      );
      mockPathJoin.mockImplementation((...paths) => {
        return paths.join('/');
      });
      mockReadFile.mockRejectedValue(new Error('File not found'));
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await analyzeMissingAndUnusedTranslations(finalExtractedData, config);

      // Assert
      // Should not process en.json (only pt.json)
      expect(mockReadFileSync).toHaveBeenCalledTimes(1);
      expect(mockReadFileSync).toHaveBeenCalledWith('/mock/extract/pt.json', {
        encoding: 'utf8',
      });
    });
  });

  describe('extractTranslationsFromSource', () => {
    test('should have correct function signature and be callable', () => {
      // Arrange & Act
      const func = extractTranslationsFromSource;

      // Assert
      expect(typeof func).toBe('function');
      expect(func.length).toBe(2); // Should accept 2 parameters: pattern and ignore
      expect(func.name).toBe('extractTranslationsFromSource');
    });

    test('should call extract with correct parameters using existing mocks', async () => {
      // Arrange
      const pattern = 'src/**/*.{ts,tsx}';
      const ignore = ['src/**/*.test.{ts,tsx}'];
      const mockFiles = ['src/component1.tsx', 'src/component2.ts'];
      const expectedResult = '{"key1": {"defaultMessage": "Hello"}}';

      mockFgSync.mockReturnValue(mockFiles);
      mockExtract.mockResolvedValue(expectedResult);

      // Act
      const result = await extractTranslationsFromSource(pattern, ignore);

      // Assert
      expect(mockFgSync).toHaveBeenCalledWith(pattern, { ignore });
      expect(mockExtract).toHaveBeenCalledWith(mockFiles, {
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
      });
      expect(result).toBe(expectedResult);
    });
  });

  describe('getTtossExtractedTranslations', () => {
    test('should return empty object when no ttoss dependencies exist', async () => {
      // Arrange
      const mockPackageJson = {
        dependencies: {
          react: '^18.0.0',
          lodash: '^4.17.21',
        },
        peerDependencies: {
          typescript: '^5.0.0',
        },
      };

      mockReadFile.mockResolvedValue(
        Buffer.from(JSON.stringify(mockPackageJson))
      );

      // Act
      const result = await getTtossExtractedTranslations();

      // Assert
      expect(result).toEqual({});
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('package.json')
      );
    });

    test('should return empty object when package.json read fails', async () => {
      // Arrange
      mockReadFile.mockRejectedValue(new Error('File not found'));

      // Act & Assert
      await expect(getTtossExtractedTranslations()).rejects.toThrow(
        'File not found'
      );
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('package.json')
      );
    });

    test('should filter and process ttoss dependencies correctly', async () => {
      // Arrange
      const mockPackageJson = {
        dependencies: {
          '@ttoss/ui': '^1.0.0',
          '@ttoss/forms': '^2.0.0',
          '@ttoss/react-i18n': '^1.0.0', // Should be ignored
          react: '^18.0.0',
        },
        peerDependencies: {
          '@ttoss/theme': '^1.0.0',
        },
      };

      // Mock package.json read
      mockReadFile.mockResolvedValue(
        Buffer.from(JSON.stringify(mockPackageJson))
      );

      // Mock path.join for dependency paths
      mockPathJoin.mockImplementation((...paths) => {
        return paths.join('/');
      });

      // Mock require calls for ttoss packages (simulate missing translation files)
      const originalRequire = require;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).require = jest.fn().mockImplementation((path) => {
        if (path.includes('@ttoss')) {
          throw new Error('Translation file not found');
        }
        return originalRequire(path);
      });

      // Act
      const result = await getTtossExtractedTranslations();

      // Assert
      expect(result).toEqual({});
      expect(mockReadFile).toHaveBeenCalledWith(
        expect.stringContaining('package.json')
      );

      // Cleanup
      global.require = originalRequire;
    });

    test('should have correct return type', async () => {
      // Arrange
      const mockPackageJson = { dependencies: {}, peerDependencies: {} };
      mockReadFile.mockResolvedValue(
        Buffer.from(JSON.stringify(mockPackageJson))
      );

      // Act
      const result = await getTtossExtractedTranslations();

      // Assert
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(false);
    });
  });

  describe('compileTranslations', () => {
    test('should compile all JSON files in extract directory', async () => {
      // Arrange
      const config = getI18nConfig();
      const mockTranslationFiles = [
        '/mock/extract/en.json',
        '/mock/extract/pt.json',
        '/mock/extract/es.json',
      ];
      const mockCompiledContent = '{"compiled": true}';

      mockFgSync.mockReturnValue(mockTranslationFiles);
      mockMkdir.mockResolvedValue(undefined);
      mockCompile.mockResolvedValue(mockCompiledContent);
      mockWriteFile.mockResolvedValue(undefined);
      mockPathJoin.mockImplementation((...paths) => {
        return paths.join('/');
      });

      // Act
      await compileTranslations(config);

      // Assert
      expect(mockFgSync).toHaveBeenCalledWith('**/*.json', {
        cwd: config.extractDir,
        absolute: true,
      });
      expect(mockMkdir).toHaveBeenCalledWith(config.compileDir, {
        recursive: true,
      });
      expect(mockCompile).toHaveBeenCalledTimes(3);
      expect(mockWriteFile).toHaveBeenCalledTimes(3);

      // Verify each file was compiled correctly
      expect(mockCompile).toHaveBeenCalledWith(['/mock/extract/en.json'], {
        ast: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('en.json'),
        mockCompiledContent
      );
    });

    test('should handle empty translation files list', async () => {
      // Arrange
      const config = getI18nConfig();
      mockFgSync.mockReturnValue([]);
      mockMkdir.mockResolvedValue(undefined);

      // Act
      await compileTranslations(config);

      // Assert
      expect(mockFgSync).toHaveBeenCalledWith('**/*.json', {
        cwd: config.extractDir,
        absolute: true,
      });
      expect(mockMkdir).toHaveBeenCalledWith(config.compileDir, {
        recursive: true,
      });
      expect(mockCompile).not.toHaveBeenCalled();
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    test('should skip files without proper filename', async () => {
      // Arrange
      const config = getI18nConfig();
      const mockTranslationFiles = [
        '/mock/extract/',
        '/mock/extract/valid.json',
      ];
      const mockCompiledContent = '{"compiled": true}';

      mockFgSync.mockReturnValue(mockTranslationFiles);
      mockMkdir.mockResolvedValue(undefined);
      mockCompile.mockResolvedValue(mockCompiledContent);
      mockWriteFile.mockResolvedValue(undefined);
      mockPathJoin.mockImplementation((...paths) => {
        return paths.join('/');
      });

      // Act
      await compileTranslations(config);

      // Assert
      expect(mockCompile).toHaveBeenCalledTimes(2);
      expect(mockWriteFile).toHaveBeenCalledTimes(1); // Only valid.json should be written
    });
  });

  describe('writeFinalExtractedData', () => {
    test('should write final data to extract file', async () => {
      // Arrange
      const finalData = JSON.stringify({
        key1: { defaultMessage: 'Message 1' },
        key2: { defaultMessage: 'Message 2' },
      });
      const config = getI18nConfig();

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeFinalExtractedData(finalData, config);

      // Assert
      expect(mockMkdir).toHaveBeenCalledWith(config.extractDir, {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(config.extractFile, finalData);
    });

    test('should handle empty final data', async () => {
      // Arrange
      const finalData = '{}';
      const config = getI18nConfig();

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeFinalExtractedData(finalData, config);

      // Assert
      expect(mockMkdir).toHaveBeenCalledWith(config.extractDir, {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(config.extractFile, finalData);
    });

    test('should create directory before writing file', async () => {
      // Arrange
      const finalData = '{"test": {"defaultMessage": "Test"}}';
      const config = getI18nConfig();

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);

      // Act
      await writeFinalExtractedData(finalData, config);

      // Assert
      // Verify mkdir is called before writeFile (both should be called)
      expect(mockMkdir).toHaveBeenCalledWith(config.extractDir, {
        recursive: true,
      });
      expect(mockWriteFile).toHaveBeenCalledWith(config.extractFile, finalData);
    });

    test('should handle directory creation failure', async () => {
      // Arrange
      const finalData = '{"test": {"defaultMessage": "Test"}}';
      const config = getI18nConfig();
      const mkdirError = new Error('Permission denied');

      mockMkdir.mockRejectedValue(mkdirError);

      // Act & Assert
      await expect(writeFinalExtractedData(finalData, config)).rejects.toThrow(
        'Permission denied'
      );
      expect(mockMkdir).toHaveBeenCalledWith(config.extractDir, {
        recursive: true,
      });
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    test('should handle file write failure', async () => {
      // Arrange
      const finalData = '{"test": {"defaultMessage": "Test"}}';
      const config = getI18nConfig();
      const writeError = new Error('Disk full');

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(writeError);

      // Act & Assert
      await expect(writeFinalExtractedData(finalData, config)).rejects.toThrow(
        'Disk full'
      );
      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledWith(config.extractFile, finalData);
    });
  });

  describe('executeI18nCli - Integration Tests', () => {
    test('should execute full CLI workflow', async () => {
      // Arrange
      const mockExtractedData = '{"key1": {"defaultMessage": "Hello"}}';
      const mockFiles = ['src/component.tsx'];

      // Mock extractTranslationsFromSource
      mockFgSync.mockReturnValue(mockFiles);
      mockExtract.mockResolvedValue(mockExtractedData);

      // Mock getTtossExtractedTranslations (package.json read)
      mockReadFile.mockResolvedValue(
        Buffer.from(JSON.stringify({ dependencies: {} }))
      );

      // Mock file operations
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockCompile.mockResolvedValue('{"compiled": true}');
      mockReadFileSync.mockReturnValue('{}'); // Empty translation files
      mockPathJoin.mockImplementation((...paths) => {
        return paths.join('/');
      });

      // Act
      await executeI18nCli();

      // Assert
      // Should extract translations
      expect(mockExtract).toHaveBeenCalledWith(mockFiles, {
        idInterpolationPattern: '[sha512:contenthash:base64:6]',
      });

      // Should write final extracted data
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('en.json'),
        expect.stringContaining('key1')
      );
    });

    test('should handle extraction errors gracefully', async () => {
      // Arrange
      const extractError = new Error('Extract failed');
      mockFgSync.mockReturnValue(['src/file.tsx']);
      mockExtract.mockRejectedValue(extractError);

      // Act & Assert
      await expect(executeI18nCli()).rejects.toThrow('Extract failed');
    });

    test('should call all required functions in workflow', async () => {
      // Arrange
      const mockExtractedData = '{"test": {"defaultMessage": "Test"}}';

      mockFgSync.mockReturnValue(['src/test.tsx']);
      mockExtract.mockResolvedValue(mockExtractedData);
      mockReadFile.mockResolvedValue(
        Buffer.from(JSON.stringify({ dependencies: {} }))
      );
      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue(undefined);
      mockCompile.mockResolvedValue('{"compiled": true}');
      mockReadFileSync.mockReturnValue('{}');
      mockPathJoin.mockImplementation((...paths) => {
        return paths.join('/');
      });

      // Act
      await executeI18nCli();

      // Assert workflow steps
      expect(mockExtract).toHaveBeenCalled(); // 1. Extract from source
      expect(mockReadFile).toHaveBeenCalled(); // 2. Read package.json for ttoss deps
      expect(mockMkdir).toHaveBeenCalled(); // 3. Create directories
      expect(mockWriteFile).toHaveBeenCalled(); // 4. Write files
      expect(mockCompile).toHaveBeenCalled(); // 5. Compile translations
    });
  });
});
