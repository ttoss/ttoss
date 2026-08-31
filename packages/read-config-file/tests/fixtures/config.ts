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

export default config;
