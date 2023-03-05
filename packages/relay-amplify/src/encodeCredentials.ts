export interface ICredentials {
  accessKeyId: string;
  sessionToken: string;
  secretAccessKey: string;
  identityId: string;
  authenticated: boolean;
  expiration?: Date;
}

export const encodeCredentials = (credentials: ICredentials) => {
  return Buffer.from(
    JSON.stringify({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    })
  ).toString('base64');
};

export const decodeCredentials = (credentials: string) => {
  return JSON.parse(Buffer.from(credentials, 'base64').toString('utf8'));
};
