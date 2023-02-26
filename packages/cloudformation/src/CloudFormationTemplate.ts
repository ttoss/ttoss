export type Parameter = {
  AllowedValues?: string[];
  Default?: string | number;
  Description?: string;
  Type: string;
  NoEcho?: boolean;
};

export type Parameters = { [key: string]: Parameter };

export type Resource = {
  Type: string;
  DeletionPolicy?: 'Delete' | 'Retain';
  Description?: string;
  DependsOn?: string[] | string;
  Condition?: string;
  Properties: any;
};

export type IAMRoleResource = Resource & {
  Type: 'AWS::IAM::Role';
  Properties: {
    AssumeRolePolicyDocument: {
      Version: '2012-10-17';
      Statement: {
        Effect: 'Allow' | 'Deny';
        Action: string;
        Principal: any;
        Condition?: { [key: string]: any };
      }[];
    };
    ManagedPolicyArns?: string[];
    Path?: string;
    Policies?: {
      PolicyName: string;
      PolicyDocument: {
        Version: '2012-10-17';
        Statement: {
          Effect: 'Allow' | 'Deny';
          Action: string | string[];
          Resource:
            | string
            | string[]
            | { [key: string]: any }
            | { [key: string]: any }[];
        }[];
      };
    }[];
  };
};

export type Resources = { [key: string]: IAMRoleResource | Resource };

export type Output = {
  Description?: string;
  Value: string | any;
  Export?: {
    Name: string | any;
  };
};

export type Outputs = { [key: string]: Output };

export type CloudFormationTemplate = {
  AWSTemplateFormatVersion: '2010-09-09';
  Metadata?: any;
  Description?: string;
  Transform?: 'AWS::Serverless-2016-10-31';
  Mappings?: any;
  Conditions?: any;
  Parameters?: Parameters;
  Resources: Resources;
  Outputs?: Outputs;
};
