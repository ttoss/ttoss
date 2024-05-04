import { getBaseStackResource } from '../baseStack/getBaseStackResource';
import { outFile, outFolder } from './buildLambdaSingleFile';
import { uploadFileToS3 } from '../s3';
import AdmZip from 'adm-zip';
import fs from 'fs';
import log from 'npmlog';
import path from 'path';

const logPrefix = 'lambda';

const zipFileName = 'lambda.zip';

export const uploadCodeToS3 = async ({ stackName }: { stackName: string }) => {
  log.info(logPrefix, `Uploading code to S3...`);

  const zip = new AdmZip();

  const code = fs.readFileSync(path.join(process.cwd(), outFolder, outFile));

  zip.addFile(outFile, code);

  if (!fs.existsSync(outFolder)) {
    fs.mkdirSync(outFolder);
  }

  zip.writeZip(`${outFolder}/${zipFileName}`);

  const bucketName = await getBaseStackResource(
    'BASE_STACK_BUCKET_LOGICAL_NAME'
  );

  return uploadFileToS3({
    bucket: bucketName,
    contentType: 'application/zip',
    key: `lambdas/${stackName}/${zipFileName}`,
    file: zip.toBuffer(),
  });
};
