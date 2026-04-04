# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ pnpm i
```

Run the following commands from the monorepo root before building the website:

```
$ pnpm --filter carlin run build
$ pnpm -w run i18n
```

### Local Development

```
$ pnpm run dev
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.
