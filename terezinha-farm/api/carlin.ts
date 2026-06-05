export default async () => {
  const isStaging = process.env.CARLIN_ENVIRONMENT === 'Staging';

  return {
    lambdaExternal: isStaging ? [] : ['graphql'],
    lambdaFormat: 'cjs',
  };
};
