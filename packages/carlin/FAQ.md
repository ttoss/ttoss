# FAQ

## Why building using TypeScript and tsup?

We need to build using TypeScript because it compiles to JavaScript files and keeps the comments. This way, we can [generate the documentation using the comments](https://github.com/ttoss/ttoss/blob/main/docs/website/plugins/carlin/getComments.js) from the source code on the website.

We use [tsup]() to create a single file to avoid the error `Error [ERR_MODULE_NOT_FOUND]: Cannot find module` that happens when we use the `type: module` in the `package.json` file and the relative paths doesn't have `.js` extension. See [this solution](https://www.npmjs.com/package/ts-add-js-extension) for more information.

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
