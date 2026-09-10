import AWS from 'aws-sdk';
import type { CommandModule, InferredOptionTypes } from 'yargs';

import { CLOUDFRONT_REGION, NAME } from '../../config';
import { addGroupToOptions } from '../../utils';
import { destroyCloudFormation } from '../cloudformation';
import { deployStaticApp } from './deployStaticApp';
import { defaultBuildFolders } from './findDefaultBuildFolder';
import { parseResponseHeaders } from './responseHeaders';

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
    describe: `Is the name of a Route 53 hosted zone. If this value is provided, ${NAME} creates the subdomains defined on \`--aliases\` option. E.g. if you have a hosted zone named "sub.domain.com", the value provided may be "sub.domain.com".`,
    type: 'string',
  },
  /**
   * CloudFront triggers can be only in US East (N. Virginia) Region.
   * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-cloudfront-triggers
   */
  region: {
    coerce: () => {
      return CLOUDFRONT_REGION;
    },
    default: CLOUDFRONT_REGION,
    hidden: true,
    type: 'string',
  },
  'redirect-to-trailing-slash': {
    default: false,
    describe:
      'Answer an extension-less request URI with a `301` to its trailing slash form instead of serving the page on both, so each page of the site has a single URL. Requires the `append-index-html` option.',
    type: 'boolean',
  },
  'response-headers': {
    coerce: parseResponseHeaders,
    default: [],
    describe:
      'Headers added by CloudFront to every response sent to viewers. Pass an object whose keys are header names and values are header values.',
  },
  'response-headers-policy': {
    describe:
      'The id of an existing CloudFront response headers policy, or the name of the exported variable whose value is the id, that will be associated to the distribution instead of the default one.',
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
  /**
   * Source maps contain the application's original source, and the bucket this
   * command uploads to is public, so publishing them is a source disclosure.
   * The default is therefore to exclude them, and including them must be an
   * explicit, deliberate choice.
   */
  'upload-source-maps': {
    default: false,
    describe:
      'Upload source map (`.map`) files to S3. They are excluded by default because the bucket is public and source maps expose the application source.',
    require: false,
    type: 'boolean',
  },
  'viewer-request-function-code': {
    describe:
      'Path to a file whose code runs as the CloudFront viewer request function of the distribution. The file must declare a `function handler(event)`, and may call the `appendIndexHtml(request)` helper carlin injects.',
    type: 'string',
  },
} as const;

export const deployStaticAppCommand: CommandModule<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any,
  InferredOptionTypes<typeof options>
> = {
  command: 'static-app',
  describe: 'Deploy static app.',
  builder: (yargs) => {
    return (
      yargs
        .options(addGroupToOptions(options, 'Deploy Static App Options'))
        /**
         * `implies` and `conflicts` cannot be used for these checks because
         * `cloudfront` and `response-headers` have default values, which yargs
         * considers as provided.
         */
        .check(({ cloudfront, responseHeaders, responseHeadersPolicy }) => {
          const hasResponseHeaders = responseHeaders?.length > 0;

          if (hasResponseHeaders && responseHeadersPolicy) {
            throw new Error(
              'The response-headers and response-headers-policy options are mutually exclusive. The distribution takes a single response headers policy.'
            );
          }

          /**
           * Response headers are applied by CloudFront, so a bucket only
           * deploy has nothing to attach them to.
           */
          if (!cloudfront && (hasResponseHeaders || responseHeadersPolicy)) {
            throw new Error(
              `The ${
                hasResponseHeaders
                  ? 'response-headers'
                  : 'response-headers-policy'
              } option requires the cloudfront option.`
            );
          }

          return true;
        })
        .check(({ appendIndexHtml, redirectToTrailingSlash, spa }) => {
          if (!redirectToTrailingSlash) {
            return true;
          }

          /**
           * The redirect is a mode of the index appending, not a behavior of
           * its own: it still serves `/docs/guide/` as
           * `/docs/guide/index.html`, and only changes what answers
           * `/docs/guide`.
           */
          if (!appendIndexHtml) {
            throw new Error(
              'The redirect-to-trailing-slash option requires the append-index-html option. It changes how an extension-less URI is answered, so the index appending it redirects to has to be on.'
            );
          }

          /**
           * An extension-less URI of a SPA is a client route rather than a
           * directory, so redirecting it to a trailing slash would move every
           * route of the app to a URL its router doesn't produce.
           */
          if (spa) {
            throw new Error(
              'The redirect-to-trailing-slash and spa options are mutually exclusive. An extension-less URI of a SPA is a client route, not a directory, so redirecting it to a trailing slash changes the URL of every route.'
            );
          }

          return true;
        })
        .check(({ appendIndexHtml, cloudfront, viewerRequestFunctionCode }) => {
          if (!viewerRequestFunctionCode) {
            return true;
          }

          /**
           * A cache behavior takes a single viewer request function, and the
           * shared base stack one is what append-index-html associates. The app
           * supplied function gets the same behavior by calling the
           * `appendIndexHtml` helper carlin injects.
           *
           * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/edge-function-restrictions-all.html
           */
          if (appendIndexHtml) {
            throw new Error(
              'The append-index-html and viewer-request-function-code options are mutually exclusive. A cache behavior takes a single viewer request function. Call `appendIndexHtml(request)` from your function instead, which carlin injects for you.'
            );
          }

          /**
           * The function is associated to a cache behavior, so a bucket only
           * deploy has nothing to attach it to.
           */
          if (!cloudfront) {
            throw new Error(
              'The viewer-request-function-code option requires the cloudfront option.'
            );
          }

          return true;
        })
        /**
         * CloudFront triggers can be only in US East (N. Virginia) Region.
         * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-requirements-cloudfront-triggers
         */
        .middleware(() => {
          AWS.config.region = CLOUDFRONT_REGION;
        })
    );
  },
  handler: ({ destroy, ...rest }) => {
    if (destroy) {
      destroyCloudFormation();
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deployStaticApp(rest as any);
    }
  },
};
