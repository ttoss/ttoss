export interface Parameter {
  AllowedValues?: string[];
  Default?: string | number;
  Description?: string;
  Type: string;
  NoEcho?: boolean;
}

export type Parameters = { [key: string]: Parameter };

export interface Resource {
  Type: string;
  DeletionPolicy?: 'Delete' | 'Retain';
  Description?: string;
  DependsOn?: string[] | string;
  Condition?: string;
  Properties: any;
}

export interface IAMRoleResource extends Resource {
  Type: 'AWS::IAM::Role';
  Properties: {
    AssumeRolePolicyDocument: {
      Version: '2012-10-17';
      Statement: {
        Effect: 'Allow' | 'Deny';
        Action: string;
        Principal: any;
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
            | { [key: string]: string }
            | { [key: string]: string }[];
        }[];
      };
    }[];
  };
}

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
  Description?: string;
  Transform?: 'AWS::Serverless-2016-10-31';
  Mappings?: any;
  Conditions?: any;
  Parameters?: Parameters;
  Resources: Resources;
  Outputs?: Outputs;
};
