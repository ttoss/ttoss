# FAQ

## Why build using TypeScript and tsup?

We use TypeScript for type safety and `tsup` to create a single executable bundle. Bundling avoids `Error [ERR_MODULE_NOT_FOUND]: Cannot find module` errors that can happen with `type: module` packages when relative imports do not include `.js` extensions. See [this solution](https://www.npmjs.com/package/ts-add-js-extension) for more information.

## Why do some ttoss packages are `noExternal` on `tsup.config.ts`?

The majority of ttoss packages exports a TypeScript file on `package.json` file to improve the developer experience.

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

But on CI, the error `TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts" for /home/runner/work/ttoss/ttoss/packages/cloudformation/src/index.ts` occurs when Carlin starts the deploy process because it's resolving the `index.ts` file. To avoid this error, we need to add all ttoss packages as `noExternal` on `tsup.config.ts` file bundle them on Carlin final bundle.

The drawback of this approach is that we need to install all ttoss packages dependencies on Carlin. For example, `import-sync` is a dependency of `ttoss/read-config-file` package, so we need to install it on Carlin to avoid the error `Error: Cannot find module 'import-sync'`.
