import { defineConfig, requiredEnv } from 'carlin/config';

export default defineConfig(({ environment, project }) => {
  return {
    project,
    parameters: {
      DomainName: `${environment}.example.com`,
      SecretValue: requiredEnv({ name: 'CARLIN_DEFINE_CONFIG_SECRET' }),
    },
  };
});
