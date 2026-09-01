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

export default getConfig;
