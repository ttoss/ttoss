# @ttoss/i18n-cli

**@ttoss/i18n-cli** is a CLI to [extract](https://formatjs.io/docs/getting-started/message-extraction) and [compile](https://formatjs.io/docs/getting-started/message-distribution) translations from your code. It implements [FormatJS Application Workflow](https://formatjs.io/docs/getting-started/application-workflow).

This package is part of the ttoss ecosystem, so it simplifies the process of extracting and compiling translations of your application and all ttoss packages that it uses. For example, if your application uses the [@ttoss/react-i18n](https://ttoss.dev/docs/modules/packages/react-i18n/), `@ttoss/i18n-cli` will extract and compile the translations of this package as well.

:::note
You should declare your messages as describe in the [FormatJS](https://formatjs.io/docs/getting-started/message-declaration) documentation.
:::

## Installation

```sh
yarn add @ttoss/i18n-cli --dev
```

## Usage

Extract only:

```sh
yarn ttoss-i18n --no-compile
```

Extract and compile:

```sh
yarn ttoss-i18n
```

Ignoring ttoss packages:

```sh
yarn ttoss-i18n --ignore-ttoss-packages
```
