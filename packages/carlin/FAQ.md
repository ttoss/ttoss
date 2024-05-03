# FAQ

## Why building using TypeScript and tsup?

We need to build using TypeScript because it compiles to JavaScript files and keeps the comments. This way, we can [generate the documentation using the comments](https://github.com/ttoss/ttoss/blob/main/docs/website/plugins/carlin/getComments.js) from the source code on the website.

We use [tsup]() to create a single file to avoid the error `Error [ERR_MODULE_NOT_FOUND]: Cannot find module` that happens when we use the `type: module` in the `package.json` file and the relative paths doesn't have `.js` extension. See [this solution](https://www.npmjs.com/package/ts-add-js-extension) for more information.

## How to link Carlin to test the changes locally?

You need to change the `exports` from `package.json` files of ttoss packages Carlin uses. You need to point to the built files instead of the source files, else you will get the error `.ts` extension not exists. So, instead of:

````json
{
  "exports": {
    ".": "./src/index.ts"
  }
}

Use:

```json
{
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "types": "./dist/index.d.ts"
    }
  },
}
```

Build the Carlin package using the following command:

```bash
pnpm build
```

Then, to link Carlin to test the changes locally, you need to run the [pnpm link](https://pnpm.io/cli/link) command in the target project.

```bash
# In the target project
pnpm link /path/to/carlin
```

After you finish testing, you can unlink the package using the [pnpm unlink](https://pnpm.io/cli/unlink) command.

```bash
# In the target project
pnpm unlink
```
````
