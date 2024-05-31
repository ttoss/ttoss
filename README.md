# ttoss - Terezinha Tech Operations

## Getting Started

The "hello world" of this repository is running [ttoss Storybook](https://storybook.ttoss.dev/) in your local machine. To do so, clone [the repository](https://github.com/ttoss/ttoss) and run the following commands on the root folder:

1. Install the dependencies:

   ```sh
   pnpm install
   ```

1. Build [@ttoss/config](https://ttoss.dev/docs/modules/packages/config/) package:

   ```sh
   pnpm build:config
   ```

1. Build i18n languages (for more information, see [@ttoss/i18n-cli](https://ttoss.dev/docs/modules/packages/i18n-cli/)):

   ```sh
   pnpm turbo run i18n
   ```

1. Run the Storybook:

   ```sh
   pnpm storybook
   ```

If everything goes well, you should see the Storybook running in your browser.

## FAQ

### Why doesn't @ttoss/config (./packages/config) have a `build` script?

It doesn't have a `build` script because its build cannot be done at the same time as the other packages. The other packages use [`@ttoss/config` package](https://ttoss.dev/docs/modules/packages/config/) on their configuration files. As the `build` command on [`turbo.json`](https://github.com/ttoss/ttoss/blob/main/turbo.json) is executed in parallel, it may happen that the other packages are built before `@ttoss/config` package, which would cause an error because they would try to use `@ttoss/config` package before it was built.

### What is `build-config` command?

`build-config` is a command that builds some packages that are used in the configuration files of the other packages. For example, it builds [`@ttoss/i18n-cli`](https://ttoss.dev/docs/modules/packages/i18n-cli/) package because it must be built before running i18n commands in the other packages.

### Do I need to build packages before importing them?

No. We use the [`exports` field](https://nodejs.org/api/packages.html#package-entry-points) to specify the package entry points of the packages and point them to the `src` folder. For example,

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

Furthermore, we configure `publishConfig` to point to the `dist` folder, so when we publish the package, it will be published pointing to the `dist` folder, which contains the built files.

```json
{
  "publishConfig": {
    "exports": {
      ".": {
        "import": "./dist/esm/index.js",
        "require": "./dist/index.js",
        "types": "./dist/index.d.ts"
      }
    }
  }
}
```

### Why doesn't TypeScript find components from ttoss libs?

With the introduction of the new [`--moduleResolution` bundler](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0-beta/#moduleresolution-bundler), TypeScript 4.7+ supports resolution features that can be interpreted natively by TypeScript, allowing exports and imports to be enabled and disabled in package.json. Because ttoss libraries use [`exports` as package entry points](https://nodejs.org/api/packages.html#package-entry-points), you need to set `moduleResolution` as `bundler` in your project tsconfig.json if it uses webpack, rollup, or other bundlers:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "moduleResolution": "bundler"
  }
}
```

If your application uses Node.js without a bundler, set `moduleResolution` to `NodeNext`.
