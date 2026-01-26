import fs from 'node:fs';

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { mockClient } from 'aws-sdk-client-mock';

import {
  copyRoot404To404Index,
  deleteOldS3Files,
  deleteS3Directory,
  emptyS3Directory,
  getBucketKeyUrl,
  uploadFileToS3,
} from '../../src/deploy/s3';

const s3Mock = mockClient(S3Client);

// Mock fs.promises.readFile
jest.mock('node:fs', () => {
  return {
    ...jest.requireActual('node:fs'),
    promises: {
      readFile: jest.fn(),
    },
  };
});

// Mock Upload from @aws-sdk/lib-storage
jest.mock('@aws-sdk/lib-storage', () => {
  return {
    Upload: jest.fn().mockImplementation(() => {
      return {
        done: jest.fn(),
      };
    }),
  };
});

describe('S3 Utils', () => {
  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
  });

  describe('getBucketKeyUrl', () => {
    test('should return the correct S3 URL', () => {
      const bucket = 'my-bucket';
      const key = 'path/to/my/file.txt';
      const expectedUrl = `https://s3.amazonaws.com/${bucket}/${key}`;
      const url = getBucketKeyUrl({ bucket, key });
      expect(url).toEqual(expectedUrl);
    });
  });

  describe('uploadFileToS3', () => {
    test('should throw error if neither file nor filePath is provided', async () => {
      await expect(
        uploadFileToS3({
          bucket: 'test-bucket',
          key: 'test-key',
        })
      ).rejects.toThrow('file or filePath must be defined');
    });

    test('should upload file buffer to S3', async () => {
      const mockUploadDone = jest.fn().mockResolvedValue({
        Bucket: 'test-bucket',
        Key: 'test-key',
        VersionId: 'version-123',
      });

      (Upload as unknown as jest.Mock).mockImplementation(() => {
        return {
          done: mockUploadDone,
        };
      });

      const fileBuffer = Buffer.from('test content');
      const result = await uploadFileToS3({
        bucket: 'test-bucket',
        key: 'test-key',
        file: fileBuffer,
        contentType: 'text/plain',
      });

      expect(result).toEqual({
        bucket: 'test-bucket',
        key: 'test-key',
        versionId: 'version-123',
        url: 'https://s3.amazonaws.com/test-bucket/test-key',
      });
      expect(Upload).toHaveBeenCalledWith({
        client: expect.anything(),
        params: expect.objectContaining({
          Bucket: 'test-bucket',
          Key: 'test-key',
          ContentType: 'text/plain',
          Body: fileBuffer,
        }),
      });
    });

    test('should upload file from path to S3', async () => {
      const mockFileContent = Buffer.from('file content from path');
      (fs.promises.readFile as jest.Mock).mockResolvedValue(mockFileContent);

      const mockUploadDone = jest.fn().mockResolvedValue({
        Bucket: 'test-bucket',
        Key: 'path/to/file.txt',
        VersionId: 'version-456',
      });

      (Upload as unknown as jest.Mock).mockImplementation(() => {
        return {
          done: mockUploadDone,
        };
      });

      const result = await uploadFileToS3({
        bucket: 'test-bucket',
        key: 'path/to/file.txt',
        filePath: '/local/path/file.txt',
      });

      expect(fs.promises.readFile).toHaveBeenCalledWith('/local/path/file.txt');
      expect(result).toEqual({
        bucket: 'test-bucket',
        key: 'path/to/file.txt',
        versionId: 'version-456',
        url: 'https://s3.amazonaws.com/test-bucket/path/to/file.txt',
      });
    });
  });

  describe('copyRoot404To404Index', () => {
    test('should copy 404.html to 404/index.html when file exists', async () => {
      s3Mock.on(HeadObjectCommand).resolves({});
      s3Mock.on(CopyObjectCommand).resolves({});

      await copyRoot404To404Index({ bucket: 'test-bucket' });

      expect(s3Mock.calls()).toHaveLength(2);
      expect(s3Mock.commandCalls(HeadObjectCommand)[0].args[0].input).toEqual({
        Bucket: 'test-bucket',
        Key: '404.html',
      });
      expect(s3Mock.commandCalls(CopyObjectCommand)[0].args[0].input).toEqual({
        Bucket: 'test-bucket',
        CopySource: 'test-bucket/404.html',
        Key: '404/index.html',
      });
    });

    test('should not copy when 404.html does not exist', async () => {
      s3Mock.on(HeadObjectCommand).rejects(new Error('Not found'));

      await copyRoot404To404Index({ bucket: 'test-bucket' });

      expect(s3Mock.calls()).toHaveLength(1);
      expect(s3Mock.commandCalls(CopyObjectCommand)).toHaveLength(0);
    });
  });

  describe('emptyS3Directory', () => {
    test('should empty directory with versions', async () => {
      s3Mock
        .on(ListObjectsV2Command)
        .resolves({
          Contents: [{ Key: 'file1.txt' }, { Key: 'file2.txt' }],
          IsTruncated: false,
        })
        .on(ListObjectVersionsCommand)
        .resolves({
          Versions: [{ VersionId: 'v1' }],
        })
        .on(DeleteObjectsCommand)
        .resolves({});

      await emptyS3Directory({ bucket: 'test-bucket', directory: 'test-dir' });

      expect(s3Mock.commandCalls(ListObjectsV2Command)).toHaveLength(1);
      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(1);
    });

    test('should handle empty directory', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [],
        IsTruncated: false,
      });

      await emptyS3Directory({ bucket: 'test-bucket', directory: 'test-dir' });

      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(0);
    });

    test('should handle delete errors', async () => {
      s3Mock
        .on(ListObjectsV2Command)
        .resolves({
          Contents: [{ Key: 'file1.txt' }],
          IsTruncated: false,
        })
        .on(ListObjectVersionsCommand)
        .resolves({
          Versions: [{ VersionId: 'v1' }],
        })
        .on(DeleteObjectsCommand)
        .resolves({
          Errors: [{ Key: 'file1.txt', Code: 'AccessDenied' }],
        });

      await expect(
        emptyS3Directory({ bucket: 'test-bucket', directory: 'test-dir' })
      ).rejects.toThrow(/Error deleting objects/);
    });
  });

  describe('deleteS3Directory', () => {
    test('should empty and delete directory', async () => {
      s3Mock
        .on(ListObjectsV2Command)
        .resolves({
          Contents: [],
          IsTruncated: false,
        })
        .on(DeleteObjectCommand)
        .resolves({});

      await deleteS3Directory({ bucket: 'test-bucket', directory: 'test-dir' });

      expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
      expect(s3Mock.commandCalls(DeleteObjectCommand)[0].args[0].input).toEqual(
        {
          Bucket: 'test-bucket',
          Key: 'test-dir',
        }
      );
    });
  });

  describe('deleteOldS3Files', () => {
    const now = new Date('2024-01-15T00:00:00.000Z');
    const oldDate = new Date('2024-01-01T00:00:00.000Z'); // 14 days ago
    const recentDate = new Date('2024-01-10T00:00:00.000Z'); // 5 days ago

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should delete files older than retention period', async () => {
      s3Mock
        .on(ListObjectsV2Command)
        .resolves({
          Contents: [
            { Key: 'old-file.txt', LastModified: oldDate },
            { Key: 'recent-file.txt', LastModified: recentDate },
          ],
          IsTruncated: false,
        })
        .on(DeleteObjectsCommand)
        .resolves({});

      await deleteOldS3Files({
        bucket: 'test-bucket',
        directory: 'test-dir',
        retentionDays: 7,
      });

      const deleteCalls = s3Mock.commandCalls(DeleteObjectsCommand);
      expect(deleteCalls).toHaveLength(1);
      expect(deleteCalls[0].args[0].input.Delete?.Objects).toEqual([
        { Key: 'old-file.txt' },
      ]);
    });

    test('should handle empty bucket', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [],
        IsTruncated: false,
      });

      await deleteOldS3Files({
        bucket: 'test-bucket',
        directory: 'test-dir',
        retentionDays: 7,
      });

      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(0);
    });

    test('should handle no old files', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [{ Key: 'recent-file.txt', LastModified: recentDate }],
        IsTruncated: false,
      });

      await deleteOldS3Files({
        bucket: 'test-bucket',
        directory: 'test-dir',
        retentionDays: 7,
      });

      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(0);
    });

    test('should handle pagination', async () => {
      s3Mock
        .on(ListObjectsV2Command)
        .resolvesOnce({
          Contents: [{ Key: 'old-file1.txt', LastModified: oldDate }],
          IsTruncated: true,
        })
        .resolvesOnce({
          Contents: [{ Key: 'old-file2.txt', LastModified: oldDate }],
          IsTruncated: false,
        })
        .on(DeleteObjectsCommand)
        .resolves({});

      await deleteOldS3Files({
        bucket: 'test-bucket',
        directory: 'test-dir',
        retentionDays: 7,
      });

      expect(s3Mock.commandCalls(ListObjectsV2Command)).toHaveLength(2);
      expect(s3Mock.commandCalls(DeleteObjectsCommand)).toHaveLength(2);
    });
  });
});
