type Config = {
  parameters: {
    foo: 'bar';
    baz: 'qux';
  };
};

const getConfig = (): Config => {
  return {
    parameters: {
      foo: 'bar',
      baz: 'qux',
    },
  };
};

// eslint-disable-next-line import/no-default-export
export default getConfig;
