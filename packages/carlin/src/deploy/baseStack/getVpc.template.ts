import { pascalCase } from 'change-case';

import { NAME } from '../../config';

import { CloudFormationTemplate } from '../../utils';

import {
  BASE_STACK_VPC_DEFAULT_SECURITY_GROUP_EXPORTED_NAME,
  BASE_STACK_VPC_ID_EXPORTED_NAME,
  BASE_STACK_VPC_PUBLIC_SUBNET_0_EXPORTED_NAME,
  BASE_STACK_VPC_PUBLIC_SUBNET_1_EXPORTED_NAME,
  BASE_STACK_VPC_PUBLIC_SUBNET_2_EXPORTED_NAME,
} from './config';

export const getVpcTemplate = () => {
  const vpcName = `${pascalCase(NAME)}VPC`;

  const EC2_INTERNET_GATEWAY_LOGICAL_ID = 'EC2InternetGateway';

  const EC2_ROUTE_TABLE_LOGICAL_ID = 'EC2RouteTable';

  const EC2_VPC_LOGICAL_ID = 'EC2VCP';

  const template: CloudFormationTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Mappings: {
      CidrMappings: {
        VPC: {
          CIDR: '10.0.0.0/16',
        },
      },
    },
    Resources: {
      [EC2_VPC_LOGICAL_ID]: {
        Type: 'AWS::EC2::VPC',
        Properties: {
          CidrBlock: {
            'Fn::FindInMap': ['CidrMappings', 'VPC', 'CIDR'],
          },
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: [
            {
              Key: 'Name',
              Value: vpcName,
            },
          ],
        },
      },
      [EC2_INTERNET_GATEWAY_LOGICAL_ID]: {
        Type: 'AWS::EC2::InternetGateway',
        Properties: {},
      },
      EC2VPCGatewayAttachment: {
        Type: 'AWS::EC2::VPCGatewayAttachment',
        Properties: {
          InternetGatewayId: {
            Ref: EC2_INTERNET_GATEWAY_LOGICAL_ID,
          },
          VpcId: {
            Ref: EC2_VPC_LOGICAL_ID,
          },
        },
      },
      [EC2_ROUTE_TABLE_LOGICAL_ID]: {
        Type: 'AWS::EC2::RouteTable',
        Properties: {
          Tags: [
            {
              Key: 'Name',
              Value: {
                'Fn::Join': [' ', [vpcName, '-', EC2_ROUTE_TABLE_LOGICAL_ID]],
              },
            },
          ],
          VpcId: {
            Ref: EC2_VPC_LOGICAL_ID,
          },
        },
      },
      EC2Route: {
        Type: 'AWS::EC2::Route',
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
          GatewayId: {
            Ref: EC2_INTERNET_GATEWAY_LOGICAL_ID,
          },
          RouteTableId: {
            Ref: EC2_ROUTE_TABLE_LOGICAL_ID,
          },
        },
      },
    },
    Outputs: {
      VPCId: {
        Value: {
          Ref: EC2_VPC_LOGICAL_ID,
        },
        Export: {
          Name: BASE_STACK_VPC_ID_EXPORTED_NAME,
        },
      },
      VPCDefaultSecurityGroup: {
        Value: {
          'Fn::GetAtt': [EC2_VPC_LOGICAL_ID, 'DefaultSecurityGroup'],
        },
        Export: {
          Name: BASE_STACK_VPC_DEFAULT_SECURITY_GROUP_EXPORTED_NAME,
        },
      },
    },
  };

  [
    BASE_STACK_VPC_PUBLIC_SUBNET_0_EXPORTED_NAME,
    BASE_STACK_VPC_PUBLIC_SUBNET_1_EXPORTED_NAME,
    BASE_STACK_VPC_PUBLIC_SUBNET_2_EXPORTED_NAME,
  ].forEach((publicSubnetExportedName, index) => {
    const publicSubnetLogicalId = `PublicSubnet${index}EC2Subnet`;

    const publicSubnetCidrMappings = `PublicSubnet${index}`;

    template.Mappings.CidrMappings[publicSubnetCidrMappings] = {
      CIDR: `10.0.${index}.0/24`,
    };

    template.Resources[publicSubnetLogicalId] = {
      Type: 'AWS::EC2::Subnet',
      Properties: {
        AvailabilityZone: {
          'Fn::Select': [
            index,
            {
              'Fn::GetAZs': {
                Ref: 'AWS::Region',
              },
            },
          ],
        },
        CidrBlock: {
          'Fn::FindInMap': ['CidrMappings', publicSubnetCidrMappings, 'CIDR'],
        },
        MapPublicIpOnLaunch: true,
        Tags: [
          {
            Key: 'Name',
            Value: {
              'Fn::Join': [
                ' ',
                [EC2_VPC_LOGICAL_ID, '-', publicSubnetLogicalId],
              ],
            },
          },
        ],
        VpcId: {
          Ref: EC2_VPC_LOGICAL_ID,
        },
      },
    };

    template.Resources[`PublicSubnet${index}EC2SubnetRouteTableAssociation`] = {
      Type: 'AWS::EC2::SubnetRouteTableAssociation',
      Properties: {
        RouteTableId: {
          Ref: EC2_ROUTE_TABLE_LOGICAL_ID,
        },
        SubnetId: {
          Ref: publicSubnetLogicalId,
        },
      },
    };

    if (!template.Outputs) {
      template.Outputs = {};
    }

    template.Outputs[publicSubnetLogicalId] = {
      Value: {
        Ref: publicSubnetLogicalId,
      },
      Export: {
        Name: publicSubnetExportedName,
      },
    };
  });

  return template;
};
