/* eslint-disable no-param-reassign */
import { CLOUDFRONT_REGION } from '../../config';
import { Command } from 'commander';
import { defaultBuildFolders } from './findDefaultBuildFolder';
import { deployStaticApp } from './deployStaticApp';
import { destroyCloudFormation } from '../cloudformation';
import AWS from 'aws-sdk';

export const options = {
  acm: {
    describe:
      'The ARN of the certificate or the name of the exported variable whose value is the ARN of the certificate that will be associated to CloudFront.',
    type: 'string',
  },
  aliases: {
    describe:
      'The aliases that will be associated with the CloudFront. See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/CNAMEs.html',
    implies: ['acm'],
    type: 'array',
  },
  'append-index-html': {
    default: false,
    describe:
      'This option appends the `index.html` to the request URI. This is useful when deploying a Docusaurus website, for example.',
    type: 'boolean',
  },
  'build-folder': {
    describe: `The folder that will be uploaded. If not provided, it'll search for the folders "${defaultBuildFolders.join(
      ', '
    )}."`,
    type: 'string',
  },
  cloudfront: {
    default: false,
    describe:
      'A CloudFront resource is created along with S3 if this option is `true`.',
    require: false,
    type: 'boolean',
  },
  'hosted-zone-name': {
    required: false,
    describe: `Is the name of a Route 53 hosted zone. If this value is provided, carlin creates the subdomains defined on \`--aliases\` option. E.g. if you have a hosted zone named "sub.domain.com", the value provided may be "sub.domain.com".`,
    type: 'string',
  },
  /**
   * CloudFront triggers can be only in US East (N. Virginia) Region.
   * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-cloudfront-triggers
   */
  region: {
    default: CLOUDFRONT_REGION,
    hidden: true,
    type: 'string',
  },
  'skip-upload': {
    default: false,
    describe:
      'Skip files upload to S3. Useful when wanting update only CloudFormation.',
    type: 'boolean',
  },
  spa: {
    default: false,
    describe:
      'This option enables CloudFront to serve a single page application (SPA).',
    require: false,
    type: 'boolean',
  },
} as const;

export const deployStaticAppCommand = new Command('static-app')
  .description('Deploy static app.')
  .allowUnknownOption(true)
  .option('--acm <arn>', options.acm.describe)
  .option('--aliases <aliases...>', options.aliases.describe)
  .option(
    '--append-index-html',
    options['append-index-html'].describe,
    options['append-index-html'].default
  )
  .option('--build-folder <folder>', options['build-folder'].describe)
  .option(
    '--cloudfront',
    options.cloudfront.describe,
    options.cloudfront.default
  )
  .option('--hosted-zone-name <name>', options['hosted-zone-name'].describe)
  .option(
    '--skip-upload',
    options['skip-upload'].describe,
    options['skip-upload'].default
  )
  .option('--spa', options.spa.describe, options.spa.default)
  .hook('preAction', () => {
    /**
     * CloudFront triggers can be only in US East (N. Virginia) Region.
     * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-cloudfront-triggers
     */
    AWS.config.region = CLOUDFRONT_REGION;
  })
  .action(async function (this: Command) {
    const opts = this.opts();
    const parentOpts = this.parent?.parent?.opts() || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allOpts: any = {
      ...parentOpts,
      ...opts,
      // Force region to CLOUDFRONT_REGION
      region: CLOUDFRONT_REGION,
    };

    // Validate aliases requires acm
    if (allOpts.aliases && !allOpts.acm) {
      throw new Error('Option --aliases requires --acm to be specified');
    }

    if (allOpts.destroy) {
      destroyCloudFormation();
    } else {
      await deployStaticApp(allOpts);
    }
  });
