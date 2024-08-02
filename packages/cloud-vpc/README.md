# @ttoss/cloud-vpc

This module provides a set of resources to create a VPC on AWS.

## Installation

```bash
pnpm install @ttoss/cloud-vpc
```

## Usage

```typescript
import { createVpcTemplate } from '@ttoss/cloud-vpc';

const cidrBlock = '10.0.0.0/16';

const template = createVpcTemplate({
  cidrBlock,
});

export default template;
```

## API

### `createVpcTemplate`

Creates a VPC template.

#### Parameters

- `cidrBlock: string` - The CIDR block of the VPC.
- `createPublicSubnets: boolean` - Whether to create public subnets. Default is `true`.
