import { createVpcTemplate } from 'src/index';

const cidrBlock = '10.0.0.0/16';

test('create VPC template with public subnets', () => {
  expect(createVpcTemplate({ cidrBlock })).toStrictEqual({
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'VPC, Subnets, and Route Tables for the project.',
    Parameters: {
      Project: { Type: 'String', Description: 'The name of the project' },
    },
    Resources: {
      Vpc: {
        Type: 'AWS::EC2::VPC',
        Properties: {
          CidrBlock: cidrBlock,
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: [{ Key: 'Name', Value: { 'Fn::Sub': '${Project}-vpc' } }],
        },
      },
      PublicSubnet1: {
        Type: 'AWS::EC2::Subnet',
        Properties: {
          AvailabilityZone: { 'Fn::Select': [0, { 'Fn::GetAZs': '' }] },
          CidrBlock: {
            'Fn::Select': [0, { 'Fn::Cidr': [cidrBlock, 4, 14] }],
          },
          MapPublicIpOnLaunch: true,
          VpcId: { Ref: 'Vpc' },
          Tags: [
            {
              Key: 'Name',
              Value: { 'Fn::Sub': '${Project}-public-subnet-1-${AWS::Region}' },
            },
          ],
        },
      },
      PublicSubnet1RouteTableAssociation: {
        Type: 'AWS::EC2::SubnetRouteTableAssociation',
        Properties: {
          RouteTableId: { Ref: 'PublicRouteTable' },
          SubnetId: { Ref: 'PublicSubnet1' },
        },
      },
      PublicSubnet2: {
        Type: 'AWS::EC2::Subnet',
        Properties: {
          AvailabilityZone: { 'Fn::Select': [1, { 'Fn::GetAZs': '' }] },
          CidrBlock: {
            'Fn::Select': [1, { 'Fn::Cidr': [cidrBlock, 4, 14] }],
          },
          MapPublicIpOnLaunch: true,
          VpcId: { Ref: 'Vpc' },
          Tags: [
            {
              Key: 'Name',
              Value: { 'Fn::Sub': '${Project}-public-subnet-2-${AWS::Region}' },
            },
          ],
        },
      },
      PublicSubnet2RouteTableAssociation: {
        Type: 'AWS::EC2::SubnetRouteTableAssociation',
        Properties: {
          RouteTableId: { Ref: 'PublicRouteTable' },
          SubnetId: { Ref: 'PublicSubnet2' },
        },
      },
      PrivateSubnet1: {
        Type: 'AWS::EC2::Subnet',
        Properties: {
          AvailabilityZone: { 'Fn::Select': [2, { 'Fn::GetAZs': '' }] },
          CidrBlock: {
            'Fn::Select': [2, { 'Fn::Cidr': [cidrBlock, 4, 14] }],
          },
          MapPublicIpOnLaunch: false,
          VpcId: { Ref: 'Vpc' },
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': '${Project}-private-subnet-1-${AWS::Region}',
              },
            },
          ],
        },
      },
      PrivateSubnet1RouteTableAssociation: {
        Type: 'AWS::EC2::SubnetRouteTableAssociation',
        Properties: {
          RouteTableId: { Ref: 'PrivateRouteTable' },
          SubnetId: { Ref: 'PrivateSubnet1' },
        },
      },
      PrivateSubnet2: {
        Type: 'AWS::EC2::Subnet',
        Properties: {
          AvailabilityZone: { 'Fn::Select': [0, { 'Fn::GetAZs': '' }] },
          CidrBlock: {
            'Fn::Select': [3, { 'Fn::Cidr': [cidrBlock, 4, 14] }],
          },
          MapPublicIpOnLaunch: false,
          VpcId: { Ref: 'Vpc' },
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': '${Project}-private-subnet-2-${AWS::Region}',
              },
            },
          ],
        },
      },
      PrivateSubnet2RouteTableAssociation: {
        Type: 'AWS::EC2::SubnetRouteTableAssociation',
        Properties: {
          RouteTableId: { Ref: 'PrivateRouteTable' },
          SubnetId: { Ref: 'PrivateSubnet2' },
        },
      },
      PublicRouteTable: {
        Type: 'AWS::EC2::RouteTable',
        Properties: {
          VpcId: { Ref: 'Vpc' },
          Tags: [
            { Key: 'Name', Value: { 'Fn::Sub': '${Project}-public-rtb' } },
          ],
        },
      },
      PrivateRouteTable: {
        Type: 'AWS::EC2::RouteTable',
        Properties: {
          VpcId: { Ref: 'Vpc' },
          Tags: [
            { Key: 'Name', Value: { 'Fn::Sub': '${Project}-private-rtb' } },
          ],
        },
      },
      InternetGateway: {
        Type: 'AWS::EC2::InternetGateway',
        Properties: {
          Tags: [{ Key: 'Name', Value: { 'Fn::Sub': '${Project}-igw' } }],
        },
      },
      InternetGatewayAttachment: {
        Type: 'AWS::EC2::VPCGatewayAttachment',
        Properties: {
          InternetGatewayId: { Ref: 'InternetGateway' },
          VpcId: { Ref: 'Vpc' },
        },
      },
      PublicRoute: {
        Type: 'AWS::EC2::Route',
        DependsOn: 'InternetGatewayAttachment',
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
          GatewayId: { Ref: 'InternetGateway' },
          RouteTableId: { Ref: 'PublicRouteTable' },
        },
      },
    },
    Outputs: {
      DefaultSecurityGroup: {
        Description: 'The default security group ID',
        Value: { 'Fn::GetAtt': ['Vpc', 'DefaultSecurityGroup'] },
      },
      VpcId: { Description: 'The VPC ID', Value: { Ref: 'Vpc' } },
      PublicSubnet1: {
        Description: 'The public subnet 1 ID',
        Value: { Ref: 'PublicSubnet1' },
      },
      PublicSubnet2: {
        Description: 'The public subnet 2 ID',
        Value: { Ref: 'PublicSubnet2' },
      },
      PrivateSubnet1: {
        Description: 'The private subnet 1 ID',
        Value: { Ref: 'PrivateSubnet1' },
      },
      PrivateSubnet2: {
        Description: 'The private subnet 2 ID',
        Value: { Ref: 'PrivateSubnet2' },
      },
    },
  });
});

test('create VPC template with private subnets only', () => {
  expect(
    createVpcTemplate({ cidrBlock, createPublicSubnets: false })
  ).toStrictEqual({
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
          CidrBlock: '10.0.0.0/16',
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
      PrivateSubnet1: {
        Type: 'AWS::EC2::Subnet',
        Properties: {
          AvailabilityZone: {
            'Fn::Select': [
              2,
              {
                'Fn::GetAZs': '',
              },
            ],
          },
          CidrBlock: {
            'Fn::Select': [
              2,
              {
                'Fn::Cidr': ['10.0.0.0/16', 4, 14],
              },
            ],
          },
          MapPublicIpOnLaunch: false,
          VpcId: {
            Ref: 'Vpc',
          },
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': '${Project}-private-subnet-1-${AWS::Region}',
              },
            },
          ],
        },
      },
      PrivateSubnet1RouteTableAssociation: {
        Type: 'AWS::EC2::SubnetRouteTableAssociation',
        Properties: {
          RouteTableId: {
            Ref: 'PrivateRouteTable',
          },
          SubnetId: {
            Ref: 'PrivateSubnet1',
          },
        },
      },
      PrivateSubnet2: {
        Type: 'AWS::EC2::Subnet',
        Properties: {
          AvailabilityZone: {
            'Fn::Select': [
              0,
              {
                'Fn::GetAZs': '',
              },
            ],
          },
          CidrBlock: {
            'Fn::Select': [
              3,
              {
                'Fn::Cidr': ['10.0.0.0/16', 4, 14],
              },
            ],
          },
          MapPublicIpOnLaunch: false,
          VpcId: {
            Ref: 'Vpc',
          },
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Sub': '${Project}-private-subnet-2-${AWS::Region}',
              },
            },
          ],
        },
      },
      PrivateSubnet2RouteTableAssociation: {
        Type: 'AWS::EC2::SubnetRouteTableAssociation',
        Properties: {
          RouteTableId: {
            Ref: 'PrivateRouteTable',
          },
          SubnetId: {
            Ref: 'PrivateSubnet2',
          },
        },
      },
      PrivateRouteTable: {
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
  });
});
