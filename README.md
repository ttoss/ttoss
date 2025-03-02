# Terezinha Tech Operations (ttoss)

<p align="center">
  <img src="https://cdn.triangulos.tech/assets/terezinha_500x500_da67d70b65.webp" />
  
</p>

## About

Terezinha Tech Operations (ttoss) is a collection of modular solutions designed to empower product development teams.

## Getting Started

The "hello world" of this repository is running [ttoss Storybook](https://storybook.ttoss.dev/) in your local machine. To do so, clone [the repository](https://github.com/ttoss/ttoss) and run the following commands on the root folder:

1. Install the dependencies:

   ```sh
   pnpm install
   ```

1. Build i18n languages (for more information, see [@ttoss/i18n-cli](https://ttoss.dev/docs/modules/packages/i18n-cli/)):

   ```sh
   pnpm i18n
   ```

1. Run the Storybook:

   ```sh
   pnpm storybook
   ```

If everything goes well, you should see the Storybook running in your browser.

## FAQ

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

### Why does the `turbo` `build` task include `^build` in `dependsOn`?

[Using the `^` prefix in the `dependsOn` configuration](https://turbo.build/repo/docs/reference/configuration#dependson) instructs turbo to ensure that tasks in the package's dependencies are completed first. For instance, the `docs/website` depends on [`carlin`](https://ttoss.dev/docs/carlin/), so the `^build` ensures that [`carlin`](https://ttoss.dev/docs/carlin/) is built before `docs/website`, as the documentation generation relies on the built code from [`carlin`](https://ttoss.dev/docs/carlin/).

### How to version breaking changes?

We use [@lerna-lite/version](https://github.com/lerna-lite/lerna-lite/tree/main/packages/version#readme) to bump version of packages changed since the last release. To version breaking changes, you need to add a `BREAKING CHANGE` section to the commit footer ([reference](https://github.com/lerna/lerna/issues/2668#issuecomment-1467902595)). For example:

```markdown
feat: add new feature

BREAKING CHANGE: this is a breaking change
```

In a GitHub pull request, you can add the message to the commit message before merging it.
