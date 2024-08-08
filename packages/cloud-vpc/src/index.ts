import type { CloudFormationTemplate } from '@ttoss/cloudformation';

export type { CloudFormationTemplate };

const NUMBER_OF_AVAILABILITY_ZONES = 3;

const PUBLIC_ROUTER_TABLE_LOGICAL_ID = 'PublicRouteTable';

const PRIVATE_ROUTER_TABLE_LOGICAL_ID = 'PrivateRouteTable';

export const createVpcTemplate = ({
  cidrBlock,
  createPublicSubnets = true,
}: {
  cidrBlock: string;
  createPublicSubnets?: boolean;
}) => {
  const totalOfSubnetsOnEachType = 2;

  const getSubnetResource = ({
    number,
    isPublic,
  }: {
    number: number;
    isPublic: boolean;
  }) => {
    const subnetType = isPublic ? 'Public' : 'Private';

    const key = `${subnetType}Subnet${number}`;

    const routerTableAssociationKey = `${subnetType}Subnet${number}RouteTableAssociation`;

    const index = (isPublic ? 0 : 1) * totalOfSubnetsOnEachType + number - 1;

    /**
     * It's because AWS infrastructure has a minimum of 3 availability zones
     * in each region. So, we need to calculate the index of the availability
     * zone based on the number of subnets and the type of subnet.
     *
     * https://aws.amazon.com/about-aws/global-infrastructure/regions_az/
     */
    const azIndex = index % NUMBER_OF_AVAILABILITY_ZONES;

    const cidrSubBlockCount = 2 * totalOfSubnetsOnEachType;

    const cidrPrefixLength = parseInt(cidrBlock.split('/')[1], 10);

    const cidrSubBlockBits =
      32 - cidrPrefixLength - Math.ceil(Math.log2(cidrSubBlockCount));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resources: any = {
      [key]: {
        Type: 'AWS::EC2::Subnet',
        Properties: {
          AvailabilityZone: {
            'Fn::Select': [azIndex, { 'Fn::GetAZs': '' }],
          },
          CidrBlock: {
            'Fn::Select': [
              index,
              { 'Fn::Cidr': [cidrBlock, cidrSubBlockCount, cidrSubBlockBits] },
            ],
          },
          MapPublicIpOnLaunch: isPublic,
          VpcId: {
            Ref: 'Vpc',
          },
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': `\${Project}-${subnetType.toLowerCase()}-subnet-${number}-\${AWS::Region}`,
              },
            },
          ],
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

    if (isPublic) {
      resources = {
        ...resources,
      };
    }

    if (!isPublic) {
      resources = {
        ...resources,
      };
    }

    return resources;
  };

  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'VPC, Subnets, and Route Tables for the project.',
    Parameters: {
      Project: {
        Type: 'String',
        Description: 'The name of the project',
      },
    },
    Resources: {
      Vpc: {
        Type: 'AWS::EC2::VPC',
        Properties: {
          CidrBlock: cidrBlock,
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': '${Project}-vpc',
              },
            },
          ],
        },
      },
      ...getSubnetResource({ number: 1, isPublic: false }),
      ...getSubnetResource({ number: 2, isPublic: false }),
      [PRIVATE_ROUTER_TABLE_LOGICAL_ID]: {
        Type: 'AWS::EC2::RouteTable',
        Properties: {
          VpcId: {
            Ref: 'Vpc',
          },
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': '${Project}-private-rtb',
              },
            },
          ],
        },
      },
    },
    Outputs: {
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
      PrivateSubnet1: {
        Description: 'The private subnet 1 ID',
        Value: {
          Ref: 'PrivateSubnet1',
        },
      },
      PrivateSubnet2: {
        Description: 'The private subnet 2 ID',
        Value: {
          Ref: 'PrivateSubnet2',
        },
      },
    },
  };

  if (createPublicSubnets) {
    template.Resources = {
      ...template.Resources,
      ...getSubnetResource({ number: 1, isPublic: true }),
      ...getSubnetResource({ number: 2, isPublic: true }),
      InternetGateway: {
        Type: 'AWS::EC2::InternetGateway',
        Properties: {
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': '${Project}-igw',
              },
            },
          ],
        },
      },
      [PUBLIC_ROUTER_TABLE_LOGICAL_ID]: {
        Type: 'AWS::EC2::RouteTable',
        Properties: {
          VpcId: {
            Ref: 'Vpc',
          },
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': '${Project}-public-rtb',
              },
            },
          ],
        },
      },
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

    template.Outputs = {
      ...template.Outputs,
      PublicSubnet1: {
        Description: 'The public subnet 1 ID',
        Value: {
          Ref: 'PublicSubnet1',
        },
      },
      PublicSubnet2: {
        Description: 'The public subnet 2 ID',
        Value: {
          Ref: 'PublicSubnet2',
        },
      },
    };
  }

  return template;
};
