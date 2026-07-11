# carlin

CLI tool for deploying AWS cloud resources using CloudFormation templates.

```bash
pnpm add -D carlin
```

**[Documentation →](https://ttoss.dev/docs/carlin/)**

## Typed Configuration

Use `defineConfig` from `carlin/config` for typed `carlin.ts` files:

```typescript
import { defineConfig, requiredEnv } from 'carlin/config';

export default defineConfig(({ environment }) => {
  return {
    environment,
    parameters: {
      DomainName: 'api.example.com',
      DatabasePassword: requiredEnv({ name: 'DATABASE_PASSWORD' }),
    },
  };
});
```

See the [configuration docs](https://ttoss.dev/docs/carlin/core-concepts/configuration) for the full flow from environment variables to CloudFormation parameters.

## License

MIT © [Pedro Arantes](https://twitter.com/arantespp)
