# ttoss - Terezinha Tech Operations

## Getting Started

The "hello world" of this repository is running [ttoss Storybook](https://storybook.ttoss.dev/) in your local machine. To do so, clone [the repository](https://github.com/ttoss/ttoss) and run the following commands on the root folder:

1. Install the dependencies:

   ```sh
   pnpm install
   ```

1. Build [`@ttoss/config` package](https://ttoss.dev/docs/modules/packages/config/):

   ```sh
   pnpm build:config
   ```

1. Build i18n languages (for more information, see [@ttoss/i18n-cli](https://ttoss.dev/docs/modules/packages/i18n-cli/):

   ```sh
   pnpm turbo run i18n
   ```

1. Run the Storybook:

   ```sh
   pnpm storybook
   ```

If everything goes well, you should see the Storybook running in your browser.

## FAQ

### Why doesn't packages/config have a `build` script?

It doesn't have a `build` script because its build cannot be done at the same time as the other packages. The others packages uses [`@ttoss/config` package](https://ttoss.dev/docs/modules/packages/config/) on their configuration files. As `build` command on [`turbo.json`](https://github.com/ttoss/ttoss/blob/main/turbo.json) is executed in parallel, it may happen that the other packages are built before `@ttoss/config` package, which would cause an error because the other packages would try to use `@ttoss/config` package before it was built.

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

### Why doesn't TypeScript find components exported using `exports`?


With the introduction of the new bundler value for moduleResolution, TypeScript 5.0+ supports resolution features that can be interpreted natively by TypeScript, allowing exports and imports to be enabled and disabled in package.json. To use these new definitions, it is necessary to configure TypeScript in tsconfig.json as follows:

tsconfig.json

```
{
    "compilerOptions": {
        "target": "esnext",
        "moduleResolution": "bundler"
    }
}
```
This configuration requires TypeScript 4.7+ and Node.js 16+. ttoss uses exports, which implies using moduleResolution as bundler. Therefore, when importing components into projects using ttoss, it is important to note these points.

