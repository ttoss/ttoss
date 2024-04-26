# FAQ

## Why building using TypeScript and tsup?

We need to build using TypeScript because it compiles to JavaScript files and keeps the comments. This way, we can [generate the documentation using the comments](https://github.com/ttoss/ttoss/blob/main/docs/website/plugins/carlin/getComments.js) from the source code on the website.

We use [tsup]() to create a single file to avoid the error `Error [ERR_MODULE_NOT_FOUND]: Cannot find module` that happens when we use the `type: module` in the `package.json` file and the relative paths doesn't have `.js` extension. See [this solution](https://www.npmjs.com/package/ts-add-js-extension) for more information.
