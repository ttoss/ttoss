# Carlin Plugin

_Note: don't forget to build Carlin before running the scripts._

Use the `printComments.js` script to print the comments of a built Carlin file. Examples:

```bash
node plugins/carlin/printComments.mjs --path cli.js
node plugins/carlin/printComments.mjs --path deploy/cloudformation.js
```

You can use the option `--find` to search for a specific comment. Example:

```bash
node plugins/carlin/printComments.mjs --path cli.js --find "The algorithm also make a find"
```

On the example above, the script will print the comment that contains the string "The algorithm also make a find".

Once you find the `longname` of the comment you found, you can add the `--longname` option to print only the comment you want to confirm the algorithm. Example:

```bash
node plugins/carlin/printComments.mjs --path cli.js --longname "cli~getConfig"
```
