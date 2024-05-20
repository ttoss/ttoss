// eslint-disable-next-line turbo/no-undeclared-env-vars, no-console
console.log(process.env.TEST_VAR);

// eslint-disable-next-line import/no-default-export
export default async () => {
  return {
    lambdaExternal: ['graphql'],
    lambdaFormat: 'cjs',
  };
};
