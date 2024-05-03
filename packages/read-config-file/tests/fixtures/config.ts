type Config = {
  parameters: {
    foo: string;
    baz: 'qux';
  };
};

class ConfigClass {
  static foo = 'bar';
}

const config: Config = {
  parameters: {
    foo: ConfigClass.foo,
    baz: 'qux',
  },
};

// eslint-disable-next-line import/no-default-export
export default config;
