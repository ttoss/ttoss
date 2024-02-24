# ttoss - Terezinha Tech Operations

## Getting Started

The "hello world" of this repository is running [ttoss Storybook](https://storybook.ttoss.dev/) in your local machine. To do so, follow the steps below:

1. Clone [the repository](https://github.com/ttoss/ttoss)
1. Install the dependencies

   ```sh
   pnpm install
   ```

1. Build [config package](https://ttoss.dev/docs/modules/packages/config/)

   ```sh
   pnpm build:config
   ```

1. Run the Storybook

   ```sh
   pnpm storybook
   ```

If everything goes well, you should see the Storybook running in your browser.

## FAQ

### Do I need to build packages before importing them?

No. We use the [`exports` field](https://nodejs.org/api/packages.html#package-entry-points) to specify the package entry points of the packages, and points it to the `src` folder. For example,

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

### Why does `i18n` command on `turbo.json` depends on `^build`?

The `i18n` command depends on `^build` because it uses the [`@ttoss/i18n-cli`](https://ttoss.dev/docs/modules/packages/i18n-cli/) package to extract the translations from the source code and generate the translation files, so it needs to be built before running the `i18n` command. You can't add `@ttoss/i18n-cli#build` as a dependency of `i18n` because it would create a circular dependency.
