import {
  AWSDateTC,
  AWSDateTimeTC,
  AWSEmailTC,
  AWSIPAddressTC,
  AWSJSONTC,
  AWSPhoneTC,
  AWSTimestampTC,
  AWSTimeTC,
  AWSURLTC,
} from '../../src';

const scalars = [
  { name: 'AWSJSON', tc: AWSJSONTC },
  { name: 'AWSDateTime', tc: AWSDateTimeTC },
  { name: 'AWSDate', tc: AWSDateTC },
  { name: 'AWSTime', tc: AWSTimeTC },
  { name: 'AWSTimestamp', tc: AWSTimestampTC },
  { name: 'AWSEmail', tc: AWSEmailTC },
  { name: 'AWSURL', tc: AWSURLTC },
  { name: 'AWSPhone', tc: AWSPhoneTC },
  { name: 'AWSIPAddress', tc: AWSIPAddressTC },
];

test.each(scalars)(
  '$name scalar is exported and has correct name',
  ({ name, tc }) => {
    expect(tc.getTypeName()).toBe(name);
  }
);
