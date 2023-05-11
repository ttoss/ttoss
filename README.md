# TTOSS

For more information about each package, please, refer to the README of them.

## Contributing

For contributing, building `config` is required, as this set some settings across all the repository.

1. Fork the repository
1. Clone it
1. Install dependencies

   ```sh
   pnpm install
   ```

1. Build [config](https://ttoss.dev/docs/modules/packages/config/):

   ```sh
   pnpm build:config
   ```

1. Contribute ;)

### Build specific packages

To build a specific package, you can build using turbo because it'll build the package and its dependencies. Just run the following command on the package folder:

```sh
pnpm turbo run build
```
