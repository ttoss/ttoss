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

export default getConfig;
