# @ttoss/monorepo

`@ttoss/monorepo` is a helper package that helps you configure your monorepo. It wraps the packages that you would install in your root package.json in a such way that you only need to run `yarn ttoss-monorepo` to get a functional monorepo.

## Install

```bash
yarn add -DW @ttoss/monorepo
```

## Setup

First, configure Git and `package.json` if you haven't already done so.

```bash
git init
npm init -y
```

To setup your monorepo, you need to execute the following command (you should have [Yarn v1](https://classic.yarnpkg.com/lang/en/) installed):

```bash
yarn ttoss-monorepo
```
