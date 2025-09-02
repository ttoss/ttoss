/* eslint-disable @typescript-eslint/no-explicit-any */
// CloudFormation intrinsic functions
export type CloudFormationRef = { Ref: string };
export type CloudFormationGetAtt = { 'Fn::GetAtt': [string, string] };
export type CloudFormationJoin = {
  'Fn::Join': [string, (string | CloudFormationRef)[]];
};
export type CloudFormationSub = {
  'Fn::Sub': string | [string, Record<string, any>];
};
export type CloudFormationSelect = { 'Fn::Select': [number, string[]] };
export type CloudFormationSplit = { 'Fn::Split': [string, string] };

export type CloudFormationIntrinsic =
  | CloudFormationRef
  | CloudFormationGetAtt
  | CloudFormationJoin
  | CloudFormationSub
  | CloudFormationSelect
  | CloudFormationSplit;

export type CloudFormationValue<T = any> = T | CloudFormationIntrinsic;

export type Parameter = {
  AllowedValues?: string[];
  Default?: string | number | boolean;
  Description?: string;
  Type:
    | 'String'
    | 'Number'
    | 'List<Number>'
    | 'CommaDelimitedList'
    | 'AWS::EC2::KeyPair::KeyName'
    | 'AWS::EC2::SecurityGroup::Id'
    | 'AWS::EC2::Subnet::Id'
    | 'AWS::EC2::VPC::Id'
    | 'List<AWS::EC2::VPC::Id>'
    | 'List<AWS::EC2::SecurityGroup::Id>'
    | 'List<AWS::EC2::Subnet::Id>';
  NoEcho?: boolean;
  MinLength?: number;
  MaxLength?: number;
  MinValue?: number;
  MaxValue?: number;
  AllowedPattern?: string;
  ConstraintDescription?: string;
};

export type Parameters = Record<string, Parameter>;

export type Condition = Record<string, any>;
export type Conditions = Record<string, Condition>;

export type PolicyStatement = {
  Sid?: string;
  Effect: 'Allow' | 'Deny';
  Action: string | string[];
  Resource?: CloudFormationValue<string | string[]>;
  Principal?: CloudFormationValue<string | Record<string, string | string[]>>;
  Condition?: Record<
    string,
    Record<string, CloudFormationValue<string | string[]>>
  >;
  NotAction?: string | string[];
  NotResource?: CloudFormationValue<string | string[]>;
  NotPrincipal?: CloudFormationValue<
    string | Record<string, string | string[]>
  >;
};

export type PolicyDocument = {
  Version: '2012-10-17';
  Id?: string;
  Statement: PolicyStatement[];
};

export type Policy = {
  PolicyName: string;
  PolicyDocument: PolicyDocument;
};

export type BaseResource = {
  Type: string;
  DeletionPolicy?: 'Delete' | 'Retain' | 'Snapshot';
  UpdateReplacePolicy?: 'Delete' | 'Retain' | 'Snapshot';
  Description?: string;
  DependsOn?: string | string[];
  Condition?: string;
  Metadata?: Record<string, any>;
  CreationPolicy?: Record<string, any>;
  UpdatePolicy?: Record<string, any>;
};

export type Resource = BaseResource & {
  Properties?: Record<string, any>;
};

export type IAMRoleResource = BaseResource & {
  Type: 'AWS::IAM::Role';
  Properties: {
    AssumeRolePolicyDocument: PolicyDocument;
    Description?: string;
    ManagedPolicyArns?: CloudFormationValue<string[]>;
    MaxSessionDuration?: number;
    Path?: string;
    PermissionsBoundary?: CloudFormationValue<string>;
    Policies?: Policy[];
    RoleName?: CloudFormationValue<string>;
    Tags?: Array<{ Key: string; Value: CloudFormationValue<string> }>;
  };
};

export type Resources = Record<string, Resource>;

export type Output = {
  Description?: string;
  Value: CloudFormationValue;
  Export?: {
    Name: CloudFormationValue<string>;
  };
  Condition?: string;
};

export type Outputs = Record<string, Output>;

export type CloudFormationTemplate = {
  AWSTemplateFormatVersion: '2010-09-09';
  Metadata?: Record<string, any>;
  Description?: string;
  Transform?: 'AWS::Serverless-2016-10-31' | string[];
  Mappings?: Record<string, Record<string, Record<string, string | number>>>;
  Conditions?: Conditions;
  Parameters?: Parameters;
  Resources: Resources;
  Outputs?: Outputs;
};
