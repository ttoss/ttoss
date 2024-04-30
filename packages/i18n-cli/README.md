# @ttoss/i18n-cli

**@ttoss/i18n-cli** is a CLI to [extract](https://formatjs.io/docs/getting-started/message-extraction) and [compile](https://formatjs.io/docs/getting-started/message-distribution) translations from your code. It implements [FormatJS Application Workflow](https://formatjs.io/docs/getting-started/application-workflow).

This package is part of the ttoss ecosystem, so it simplifies the process of extracting and compiling translations of your application and all ttoss packages that it uses. For example, if your application uses the [@ttoss/react-i18n](/docs/modules/packages/react-i18n/), `@ttoss/i18n-cli` will extract and compile the translations of this package as well.

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
    "i18n": "ttoss-i18n"
  }
}
```

Add to your `.gitignore`:

```
i18n/compiled/
i18n/missing/
```

## Usage

### Extract only:

```sh
pnpm i18n --no-compile # ttoss-i18n --no-compile
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

`en` is the default language, so you don't need to create a file for it. But you need to create a file for each language you want to translate.

### Extract and compile:

```sh
pnpm i18n # ttoss-i18n
```

This command extracts translations from your code and compiles them into a usable format. And create a new path (`i18n/compiled/LANG.json` and `i18n/missing/LANG.json`) if doesn't exists with compiled translations based in all of the files on path `i18n/lang`. As followed below:

- 📂 i18n
  - 📂 compiled
    - 📄 en.json
    - 📄 pt-BR.json
  - 📂 lang
    - 📄 en.json
    - 📄 pt-BR.json
  - 📂 missing
    - 📄 en.json
    - 📄 pt-BR.json

#### i18n/compiled/en.json

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

#### i18n/compiled/pt-BR.json

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

The `i18n/missing` folder contains all the translations that are missing in the `i18n/lang/LANG.json` file, compared with `i18n/lang/en.json`. This folder is useful to know which translations are missing in your application.

### Ignoring ttoss packages:

```sh
pnpm i18n --ignore-ttoss-packages # ttoss-i18n --ignore-ttoss-packages
```

This command extracts and compiles translations, ignoring translations from all ttoss packages, if you have them installed in your project.
