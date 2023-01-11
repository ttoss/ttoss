# @ttoss/cloud-auth

## Installation

```bash
yarn install @ttoss/cloud-auth
```

## Quickstart

Create a `clouformation.ts` file in your project and export the template:

```typescript src/cloudformation.ts
import { createAuthTemplate } from '@ttoss/cloud-auth';

const template = createAuthTemplate({
  autoVerifiedAttributes: false,
  identityPool: false,
});

export default template;
```
