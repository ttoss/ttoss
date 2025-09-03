import { getBucketKeyUrl } from 'src/deploy/s3';

test('getBucketKeyUrl should return the correct S3 URL', () => {
  const bucket = 'my-bucket';
  const key = 'path/to/my/file.txt';
  const expectedUrl = `https://s3.amazonaws.com/${bucket}/${key}`;
  const url = getBucketKeyUrl({ bucket, key });
  expect(url).toEqual(expectedUrl);
});
