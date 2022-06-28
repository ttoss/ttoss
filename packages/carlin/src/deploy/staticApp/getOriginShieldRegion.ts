/**
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/origin-shield.html#choose-origin-shield-region
 * @param region
 */
export const getOriginShieldRegion = (region: string) => {
  switch (region) {
    case 'us-west-1':
      return 'us-west-2';

    case 'af-south-1':
      return 'eu-west-1';

    case 'ap-east-1':
      return 'ap-southeast-1';

    case 'ca-central-1':
      return 'us-east-1';

    case 'eu-south-1':
      return 'eu-central-1';

    case 'eu-west-3':
      return 'eu-west-2';

    case 'eu-north-1':
      return 'eu-west-2';

    case 'me-south-1':
      return 'ap-south-1';

    default:
      return region;
  }
};
