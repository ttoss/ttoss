import { getBaseStackResource } from '../baseStack/getBaseStackResource';
import { uploadFileToS3 } from '../s3';
import AdmZip from 'adm-zip';
import fs from 'node:fs';
import log from 'npmlog';

const logPrefix = 'lambda';

export const zipFileName = 'lambda.zip';

export const uploadCodeToS3 = async ({
  stackName,
  lambdaOutdir,
}: {
  stackName: string;
  lambdaOutdir: string;
}) => {
  log.info(logPrefix, `Uploading code to S3...`);

  const zip = new AdmZip();

  const zipFile = `${lambdaOutdir}/${zipFileName}`;

  /**
   * Check if the zip file already exists and delete it before creating a new.
   */
  if (fs.existsSync(zipFile)) {
    await fs.promises.rm(zipFile);
  }

  /**
   * Zip entire directory.
   */
  zip.addLocalFolder(lambdaOutdir);

  zip.writeZip(`${lambdaOutdir}/${zipFileName}`);

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
