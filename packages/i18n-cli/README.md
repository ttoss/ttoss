# @ttoss/i18n-cli

**@ttoss/i18n-cli** is a CLI to [extract](https://formatjs.io/docs/getting-started/message-extraction) and [compile](https://formatjs.io/docs/getting-started/message-distribution) translations from your code. It implements [FormatJS Application Workflow](https://formatjs.io/docs/getting-started/application-workflow).

This package is part of the ttoss ecosystem, so it simplifies the process of extracting and compiling translations of your application and all ttoss packages that it uses. For example, if your application uses the [@ttoss/react-i18n](./react-i18n/), `@ttoss/i18n-cli` will extract and compile the translations of this package as well.

:::note
You should declare your messages as describe in the [FormatJS](https://formatjs.io/docs/getting-started/message-declaration) documentation.
:::

## Installation

```sh
pnpm add @ttoss/i18n-cli --dev
```

## Setup

Add this script to your `package.json`

```json
{
  "scripts": {
    "i18n": "ttoss-i18n",
    "i18n:extract": "ttoss-i18n --no-compile",
    "i18n:ignore-ttoss-pkg": "ttoss-i18n --ignore-ttoss-packages"
  }
}
```

## Usage

### Extract only:

```sh
pnpm run i18n:extract
```

This command extracts translations from your code but doesn't compile them. And created a new path (`i18n/lang/en.json`) if doesn't exists with extracted translations. As followed below:

- 📂 i18n
  - 📂 lang
    - 📄 en.json

```json
// i18n/lang/en.json
{
  "0XOzcH": {
    "defaultMessage": "My title page",
    "description": "Page title"
  }
}
```

To translate your text, you only need to duplicate the file `i18n/lang/en.json` to your new language and translate it, as followed below:

```json
// i18n/lang/pt-BR.json
{
  "0XOzcH": {
    "defaultMessage": "Título da minha página",
    "description": "Título da página"
  }
}
```

### Extract and compile:

```sh
pnpm run i18n
```

This command extracts translations from your code and compiles them into a usable format. And create a new path (`i18n/compiled/en.json`) if doesn't exists with compiled translations based in all of the files on path `i18n/lang`. As followed below:

- 📂 i18n
  - 📂 compiled
    - 📄 en.json
    - 📄 pt-BR.json

#### en.json

```json
// i18n/compiled/en.json
{
  "0XOzcH": [
    {
      "type": 0,
      "value": "My title page"
    }
  ]
}
```

#### pt-BR.json

```json
// i18n/compiled/pt-BR.json
{
  "0XOzcH": [
    {
      "type": 0,
      "value": "Título da minha página"
    }
  ]
}
```

### Ignoring ttoss packages:

```sh
pnpm run i18n:ignore-ttoss-pkg
```

This command extracts and compiles translations, ignoring translations from all ttoss packages, if you have them installed in your project.
