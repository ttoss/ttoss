export const encode = (obj: unknown) => {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
};

export const decode = (encoded: string) => {
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
};
