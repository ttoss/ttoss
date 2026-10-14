import type {
  CloudFormationTemplate,
  Outputs,
  Resources,
} from '@ttoss/cloudformation';

export type { CloudFormationTemplate };

const NUMBER_OF_AVAILABILITY_ZONES = 3;

const PUBLIC_ROUTER_TABLE_LOGICAL_ID = 'PublicRouteTable';

const PRIVATE_ROUTER_TABLE_LOGICAL_ID = 'PrivateRouteTable';

const TOTAL_OF_SUBNETS_ON_EACH_TYPE = 2;

const getNameTags = (name: string) => {
  return [
    {
      Key: 'Name',
      Value: {
        'Fn::Sub': name,
      },
    },
  ];
};

const getSubnetCidrBlock = ({
  cidrBlock,
  index,
}: {
  cidrBlock: string;
  index: number;
}) => {
  const cidrSubBlockCount = 2 * TOTAL_OF_SUBNETS_ON_EACH_TYPE;

  const cidrPrefixLength = parseInt(cidrBlock.split('/')[1], 10);

  const cidrSubBlockBits =
    32 - cidrPrefixLength - Math.ceil(Math.log2(cidrSubBlockCount));

  return {
    'Fn::Select': [
      index,
      { 'Fn::Cidr': [cidrBlock, cidrSubBlockCount, cidrSubBlockBits] },
    ],
  };
};

const getSubnetResource = ({
  cidrBlock,
  number,
  isPublic,
}: {
  cidrBlock: string;
  number: number;
  isPublic: boolean;
}): Resources => {
  const subnetType = isPublic ? 'Public' : 'Private';

  const key = `${subnetType}Subnet${number}`;

  const routerTableAssociationKey = `${subnetType}Subnet${number}RouteTableAssociation`;

  const index = (isPublic ? 0 : 1) * TOTAL_OF_SUBNETS_ON_EACH_TYPE + number - 1;

  /**
   * It's because AWS infrastructure has a minimum of 3 availability zones
   * in each region. So, we need to calculate the index of the availability
   * zone based on the number of subnets and the type of subnet.
   *
   * https://aws.amazon.com/about-aws/global-infrastructure/regions_az/
   */
  const azIndex = index % NUMBER_OF_AVAILABILITY_ZONES;

  return {
    [key]: {
      Type: 'AWS::EC2::Subnet',
      Properties: {
        AvailabilityZone: {
          'Fn::Select': [azIndex, { 'Fn::GetAZs': '' }],
        },
        CidrBlock: getSubnetCidrBlock({ cidrBlock, index }),
        MapPublicIpOnLaunch: isPublic,
        VpcId: {
          Ref: 'Vpc',
        },
        Tags: getNameTags(
          `\${Project}-${subnetType.toLowerCase()}-subnet-${number}-\${AWS::Region}`
        ),
      },
    },
    [routerTableAssociationKey]: {
      Type: 'AWS::EC2::SubnetRouteTableAssociation',
      Properties: {
        RouteTableId: {
          Ref: isPublic
            ? PUBLIC_ROUTER_TABLE_LOGICAL_ID
            : PRIVATE_ROUTER_TABLE_LOGICAL_ID,
        },
        SubnetId: {
          Ref: key,
        },
      },
    },
  };
};

const getRouteTableResource = ({ name }: { name: string }) => {
  return {
    Type: 'AWS::EC2::RouteTable',
    Properties: {
      VpcId: {
        Ref: 'Vpc',
      },
      Tags: getNameTags(name),
    },
  };
};

const getSubnetOutput = ({
  number,
  isPublic,
}: {
  number: number;
  isPublic: boolean;
}): Outputs => {
  const subnetType = isPublic ? 'Public' : 'Private';

  return {
    [`${subnetType}Subnet${number}`]: {
      Description: `The ${subnetType.toLowerCase()} subnet ${number} ID`,
      Value: {
        Ref: `${subnetType}Subnet${number}`,
      },
    },
  };
};

const getVpcAndPrivateResources = ({
  cidrBlock,
}: {
  cidrBlock: string;
}): Resources => {
  return {
    Vpc: {
      Type: 'AWS::EC2::VPC',
      Properties: {
        CidrBlock: cidrBlock,
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: getNameTags('${Project}-vpc'),
      },
    },
    ...getSubnetResource({ cidrBlock, number: 1, isPublic: false }),
    ...getSubnetResource({ cidrBlock, number: 2, isPublic: false }),
    [PRIVATE_ROUTER_TABLE_LOGICAL_ID]: getRouteTableResource({
      name: '${Project}-private-rtb',
    }),
  };
};

const getVpcAndPrivateOutputs = (): Outputs => {
  return {
    DefaultSecurityGroup: {
      Description: 'The default security group ID',
      Value: {
        'Fn::GetAtt': ['Vpc', 'DefaultSecurityGroup'],
      },
    },
    VpcId: {
      Description: 'The VPC ID',
      Value: {
        Ref: 'Vpc',
      },
    },
    ...getSubnetOutput({ number: 1, isPublic: false }),
    ...getSubnetOutput({ number: 2, isPublic: false }),
  };
};

const getPublicResources = ({
  cidrBlock,
}: {
  cidrBlock: string;
}): Resources => {
  return {
    ...getSubnetResource({ cidrBlock, number: 1, isPublic: true }),
    ...getSubnetResource({ cidrBlock, number: 2, isPublic: true }),
    InternetGateway: {
      Type: 'AWS::EC2::InternetGateway',
      Properties: {
        Tags: getNameTags('${Project}-igw'),
      },
    },
    [PUBLIC_ROUTER_TABLE_LOGICAL_ID]: getRouteTableResource({
      name: '${Project}-public-rtb',
    }),
    InternetGatewayAttachment: {
      Type: 'AWS::EC2::VPCGatewayAttachment',
      Properties: {
        InternetGatewayId: {
          Ref: 'InternetGateway',
        },
        VpcId: {
          Ref: 'Vpc',
        },
      },
    },
    PublicRoute: {
      Type: 'AWS::EC2::Route',
      DependsOn: 'InternetGatewayAttachment',
      Properties: {
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: {
          Ref: 'InternetGateway',
        },
        RouteTableId: {
          Ref: PUBLIC_ROUTER_TABLE_LOGICAL_ID,
        },
      },
    },
  };
};

const getPublicOutputs = (): Outputs => {
  return {
    ...getSubnetOutput({ number: 1, isPublic: true }),
    ...getSubnetOutput({ number: 2, isPublic: true }),
  };
};

export const createVpcTemplate = ({
  cidrBlock,
  createPublicSubnets = true,
}: {
  cidrBlock: string;
  createPublicSubnets?: boolean;
}) => {
  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'VPC, Subnets, and Route Tables for the project.',
    Parameters: {
      Project: {
        Type: 'String',
        Description: 'The name of the project',
      },
    },
    Resources: getVpcAndPrivateResources({ cidrBlock }),
    Outputs: getVpcAndPrivateOutputs(),
  };

  if (createPublicSubnets) {
    template.Resources = {
      ...template.Resources,
      ...getPublicResources({ cidrBlock }),
    };

    template.Outputs = {
      ...template.Outputs,
      ...getPublicOutputs(),
    };
  }

  return template;
};
