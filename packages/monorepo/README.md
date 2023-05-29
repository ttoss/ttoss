# @ttoss/monorepo

`@ttoss/monorepo` is a tool to setup a monorepo with [pnpm](https://pnpm.js.org/) based on ttoss conventions.

## Install

```bash
pnpm add -Dw @ttoss/monorepo
```

## Setup

First, configure Git and `package.json` if you haven't already done so.

```bash
git init
npm init -y
```

To setup your monorepo, you need to execute the following command:

```bash
npx @ttoss/monorepo setup
```
