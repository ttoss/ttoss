import { tsdownConfig } from '@ttoss/config';

export default tsdownConfig({
  entry: [
    'src/index.ts',
    'src/AmazonCognito/index.ts',
    'src/flows/index.ts',
    'src/emails/index.ts',
  ],
});
