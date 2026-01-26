import * as s3 from '../../src/deploy/s3';
import * as findDefaultBuildFolder from '../../src/deploy/staticApp/findDefaultBuildFolder';
import { uploadBuiltAppToS3 } from '../../src/deploy/staticApp/uploadBuiltAppToS3';

jest.mock('../../src/deploy/s3');
jest.mock('../../src/deploy/staticApp/findDefaultBuildFolder');

describe('uploadBuiltAppToS3', () => {
  const mockBucket = 'test-bucket';
  const mockDirectory = '/path/to/build';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with buildFolder provided', () => {
    test('should upload files and delete old files when directory has files', async () => {
      jest
        .spyOn(s3, 'getAllFilesInsideADirectory')
        .mockResolvedValue(['file1.js', 'file2.html']);
      jest.spyOn(s3, 'deleteOldS3Files').mockResolvedValue(5);
      jest.spyOn(s3, 'uploadDirectoryToS3').mockResolvedValue();

      await uploadBuiltAppToS3({
        buildFolder: mockDirectory,
        bucket: mockBucket,
      });

      expect(s3.getAllFilesInsideADirectory).toHaveBeenCalledWith({
        directory: mockDirectory,
      });
      expect(s3.deleteOldS3Files).toHaveBeenCalledWith({
        bucket: mockBucket,
        retentionDays: 7,
      });
      expect(s3.uploadDirectoryToS3).toHaveBeenCalledWith({
        bucket: mockBucket,
        directory: mockDirectory,
      });
    });

    test('should not delete old files when directory is empty', async () => {
      jest.spyOn(s3, 'getAllFilesInsideADirectory').mockResolvedValue([]);
      jest.spyOn(s3, 'deleteOldS3Files').mockResolvedValue(0);
      jest.spyOn(s3, 'uploadDirectoryToS3').mockResolvedValue();

      await uploadBuiltAppToS3({
        buildFolder: mockDirectory,
        bucket: mockBucket,
      });

      expect(s3.getAllFilesInsideADirectory).toHaveBeenCalledWith({
        directory: mockDirectory,
      });
      expect(s3.deleteOldS3Files).not.toHaveBeenCalled();
      expect(s3.uploadDirectoryToS3).toHaveBeenCalledWith({
        bucket: mockBucket,
        directory: mockDirectory,
      });
    });
  });

  describe('without buildFolder provided', () => {
    test('should use default build folder and copy 404 files', async () => {
      const mockDefaultDirectory = '/default/build';
      jest
        .spyOn(findDefaultBuildFolder, 'findDefaultBuildFolder')
        .mockResolvedValue(mockDefaultDirectory);
      jest.spyOn(s3, 'deleteOldS3Files').mockResolvedValue(3);
      jest.spyOn(s3, 'uploadDirectoryToS3').mockResolvedValue();
      jest.spyOn(s3, 'copyRoot404To404Index').mockResolvedValue();

      await uploadBuiltAppToS3({
        bucket: mockBucket,
      });

      expect(findDefaultBuildFolder.findDefaultBuildFolder).toHaveBeenCalled();
      expect(s3.deleteOldS3Files).toHaveBeenCalledWith({
        bucket: mockBucket,
        retentionDays: 7,
      });
      expect(s3.uploadDirectoryToS3).toHaveBeenCalledWith({
        bucket: mockBucket,
        directory: mockDefaultDirectory,
      });
      expect(s3.copyRoot404To404Index).toHaveBeenCalledWith({
        bucket: mockBucket,
      });
    });

    test('should throw error when no default build folder is found', async () => {
      jest
        .spyOn(findDefaultBuildFolder, 'findDefaultBuildFolder')
        .mockResolvedValue(undefined as unknown as string);

      await expect(
        uploadBuiltAppToS3({
          bucket: mockBucket,
        })
      ).rejects.toThrow(/build-folder option wasn't provided/);

      expect(findDefaultBuildFolder.findDefaultBuildFolder).toHaveBeenCalled();
    });
  });
});
