type Config = {
  parameters: {
    foo: string;
    baz: string;
  };
};

const getConfig = ({ foo, baz }: { foo: string; baz: string }): Config => {
  return {
    parameters: { foo, baz },
  };
};

// eslint-disable-next-line import/no-default-export
export default getConfig;
