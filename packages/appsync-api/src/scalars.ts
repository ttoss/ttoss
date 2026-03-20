import { schemaComposer } from '@ttoss/graphql-api';

/** AWS AppSync scalar for JSON data. Represents a JSON object or array. */
export const AWSJSONTC = schemaComposer.createScalarTC(`scalar AWSJSON`);

/** AWS AppSync scalar for combined date and time values (ISO 8601, e.g. `2007-04-05T14:30:28Z`). */
export const AWSDateTimeTC =
  schemaComposer.createScalarTC(`scalar AWSDateTime`);

/** AWS AppSync scalar for date values (ISO 8601, e.g. `1970-01-01`). */
export const AWSDateTC = schemaComposer.createScalarTC(`scalar AWSDate`);

/** AWS AppSync scalar for time values (ISO 8601, e.g. `12:30:00.000Z`). */
export const AWSTimeTC = schemaComposer.createScalarTC(`scalar AWSTime`);

/** AWS AppSync scalar for Unix epoch timestamps (integer, seconds since 1970-01-01T00:00:00Z). */
export const AWSTimestampTC =
  schemaComposer.createScalarTC(`scalar AWSTimestamp`);

/** AWS AppSync scalar for email addresses (RFC 822). */
export const AWSEmailTC = schemaComposer.createScalarTC(`scalar AWSEmail`);

/** AWS AppSync scalar for URLs (RFC 1738). */
export const AWSURLTC = schemaComposer.createScalarTC(`scalar AWSURL`);

/** AWS AppSync scalar for phone numbers (E.164 format). */
export const AWSPhoneTC = schemaComposer.createScalarTC(`scalar AWSPhone`);

/** AWS AppSync scalar for IPv4 and IPv6 addresses. */
export const AWSIPAddressTC =
  schemaComposer.createScalarTC(`scalar AWSIPAddress`);
