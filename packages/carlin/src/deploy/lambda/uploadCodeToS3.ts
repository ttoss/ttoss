import { getBaseStackResource } from '../baseStack/getBaseStackResource';
import { uploadFileToS3 } from '../s3';
import AdmZip from 'adm-zip';
import fs from 'fs';
import log from 'npmlog';
import path from 'path';

const logPrefix = 'lambda';

const outFolder = 'dist';

const outFile = 'index.js';

export const uploadCodeToS3 = async ({ stackName }: { stackName: string }) => {
  log.info(logPrefix, `Uploading code to S3...`);

  const zip = new AdmZip();

  const code = fs.readFileSync(path.join(process.cwd(), outFolder, outFile));

  zip.addFile('index.js', code);

  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  zip.writeZip('dist/lambda.zip');

  const bucketName = await getBaseStackResource(
    'BASE_STACK_BUCKET_LOGICAL_NAME'
  );

  return uploadFileToS3({
    bucket: bucketName,
    contentType: 'application/zip',
    key: `lambdas/${stackName}/lambda.zip`,
    file: zip.toBuffer(),
  });
};
