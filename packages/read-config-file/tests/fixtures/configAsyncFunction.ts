type Config = {
  parameters: {
    foo: 'bar';
    baz: 'qux';
  };
};

const getConfig = async (): Promise<Config> => {
  return {
    parameters: {
      foo: 'bar',
      baz: 'qux',
    },
  };
};

export default getConfig;
