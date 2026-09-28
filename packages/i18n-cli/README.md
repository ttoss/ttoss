# @ttoss/i18n-cli

A CLI tool for extracting and compiling translations from your code using [FormatJS](https://formatjs.io/docs/getting-started/application-workflow). Automatically handles translations from your application and all ttoss packages.

## Key Features

- **Automatic extraction** from source code using FormatJS patterns
- **Unified translation management** for your app and ttoss packages
- **Missing translation detection** with detailed reports
- **Unused translation cleanup** to maintain clean translation files
- **Flexible compilation** with optional steps
- **Custom file patterns** and ignore rules

## Installation

```sh
pnpm add @ttoss/i18n-cli --dev
```

## Quick Start

Add script to your `package.json`:

```json
{
  "scripts": {
    "i18n": "ttoss-i18n"
  }
}
```

Add to `.gitignore`:

```
i18n/compiled/
i18n/missing/
i18n/unused/
```

Run extraction and compilation:

```sh
pnpm i18n
```

## How It Works

The CLI creates a structured workflow for managing translations:

```
📁 i18n/
├── 📁 lang/              # Translation files
│   ├── 📄 en.json        # Auto-generated (don't edit)
│   └── 📄 pt-BR.json     # Edit with your translations
├── 📁 compiled/          # Auto-generated (production files)
│   ├── 📄 en.json        # Compiled for runtime
│   └── 📄 pt-BR.json     # Compiled for runtime
├── 📁 missing/           # Auto-generated (analysis reports)
│   └── 📄 pt-BR.json     # What needs translation
└── 📁 unused/            # Auto-generated (cleanup reports)
    └── 📄 pt-BR.json     # Unused translations per language
```

## Usage

### Basic Commands

**Extract and compile everything:**

```sh
pnpm i18n
```

**Extract only (no compilation):**

```sh
pnpm i18n --no-compile
```

**Ignore ttoss package translations:**

```sh
pnpm i18n --ignore-ttoss-packages
```

**Custom file patterns:**

```sh
pnpm i18n --pattern "src/**/*.{ts,tsx}" --ignore "**/*.test.*"
```

### Translation Workflow

Follow this step-by-step process to set up internationalization:

#### Step 1: Write Code with FormatJS Messages

```tsx
import { FormattedMessage } from 'react-intl';

<FormattedMessage
  defaultMessage="Welcome to our app!"
  description="Main welcome message"
/>;
```

#### Step 2: Extract Messages from Source Code

```sh
pnpm i18n --no-compile
```

**Result:** Creates `i18n/lang/en.json` directly with all messages found in your code:

```json
{
  "2mAHlQ": {
    "defaultMessage": "Welcome to our app!",
    "description": "Main welcome message"
  }
}
```

> **Important**: Don't edit `en.json` manually - it will be overwritten on next extraction.

#### Step 3: Create Translation Files

Copy the base English file to create other language files:

```sh
# Create files for other languages
cp i18n/lang/en.json i18n/lang/pt-BR.json
cp i18n/lang/en.json i18n/lang/es.json
```

#### Step 4: Translate Your Messages

Edit each language file with the appropriate translations:

> **These are the ONLY files you should edit manually**

**`i18n/lang/pt-BR.json`:**

```json
{
  "2mAHlQ": {
    "defaultMessage": "Bem-vindo ao nosso app!",
    "description": "Mensagem principal de boas-vindas"
  }
}
```

**`i18n/lang/es.json`:**

```json
{
  "2mAHlQ": {
    "defaultMessage": "¡Bienvenido a nuestra app!",
    "description": "Mensaje principal de bienvenida"
  }
}
```

#### Step 5: Compile for Production

```sh
pnpm i18n
```

**Result:** Generates optimized compiled files and analysis reports:

- `i18n/compiled/` - Production-ready translation files
- `i18n/missing/` - Shows untranslated messages
- `i18n/unused/` - Identifies unused translations

### Generated Files

**Base Language File (`i18n/lang/en.json`) - Auto-generated:**

```json
{
  "2mAHlQ": {
    "defaultMessage": "Welcome to our app!",
    "description": "Main welcome message"
  }
}
```

**Translation Files (`i18n/lang/pt-BR.json`) - Edit with your translations:**

```json
{
  "2mAHlQ": {
    "defaultMessage": "Bem-vindo ao nosso app!",
    "description": "Mensagem principal de boas-vindas"
  }
}
```

**Compiled Output (`i18n/compiled/pt-BR.json`) - Auto-generated:**

```json
{
  "2mAHlQ": [
    {
      "type": 0,
      "value": "Bem-vindo ao nosso app!"
    }
  ]
}
```

### Analysis Reports

The CLI automatically generates helpful reports to assist with translation management:

- **Missing translations** (`i18n/missing/LANG.json`): Shows what needs translation
- **Unused translations** (`i18n/unused/LANG.json`): Identifies translations to remove per language

> **Note**: All reports are auto-generated - use them as reference only.

## Command Options

| Option                     | Description                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--no-compile`             | Extract only, skip compilation and the reports                                                                                  |
| `--source-locale <locale>` | The language your `defaultMessage`s are written in (default `en`). The extracted file is `i18n/lang/<locale>.json`              |
| `--scope <scope>`          | Package scopes whose catalogs are merged, repeatable or comma-separated (default `@ttoss`), e.g. `--scope @ttoss --scope @acme` |
| `--explicit-ids <glob>`    | Files whose messages must declare an explicit `id` (see below). Extraction fails otherwise                                      |
| `--ignore-dependencies`    | Skip dependency catalogs (`--ignore-ttoss-packages` is an alias)                                                                |
| `--pattern <glob>`         | Custom file pattern for extraction (default: `src/**/*.{ts,tsx}`)                                                               |
| `--ignore <patterns>`      | Files/patterns to ignore during extraction                                                                                      |

### Authoring in a language other than English

```sh
ttoss-i18n --source-locale pt-BR
```

The extracted file becomes `i18n/lang/pt-BR.json`, translations go in the other files (`en.json`, `es.json`), and `i18n/manifest.json` records the source locale so packages depending on yours merge its catalog correctly. Pair it with `defaultLocale="pt-BR"` on `I18nProvider` (or `createI18n`) so fallback text is formatted with the right rules.

### Explicit ids for persisted messages

Content-hash ids change whenever the text does. That is fine for text rendered immediately, but a message **reference** stored in a database (see [`@ttoss/i18n-core`](https://ttoss.dev/docs/modules/packages/i18n-core/)) would be orphaned by the next copy edit. Keep those messages in dedicated files and give them explicit ids:

```sh
ttoss-i18n --explicit-ids 'src/notifications/messages.ts'
```

## `ttoss-i18n check`

For CI. Writes nothing and exits non-zero when:

- a required locale is missing a translation (`--locales en,es`; defaults to every file in `i18n/lang` but the source);
- an id is declared with different text by your package and a dependency, or by two dependencies;
- a message in an `--explicit-ids` file relies on a hashed id.

```sh
ttoss-i18n check --source-locale pt-BR --locales en --explicit-ids 'src/notifications/**'
```

## Integration with ttoss Ecosystem

The CLI reads the catalogs of every in-scope dependency — direct and transitive, nearest first — and:

- adds their messages to your source file, in your source locale when the dependency ships it;
- compiles each locale with **every translation the dependencies ship**, so you never re-translate a string `@ttoss/forms` already translates; your own files override them;
- leaves those ids out of `i18n/missing`, since they are covered.

A dependency catalog that exists but cannot be parsed fails the run rather than being skipped silently.

Every `@ttoss/*` build injects ids with `@ttoss/config`'s `I18N_ID_INTERPOLATION_PATTERN`, which is also what the CLI extracts with. Configure your own bundler with the same pattern — `formatjsSwcPlugin()` / `formatjsBabelPlugin()` from `@ttoss/config` — or no id will match and every message silently falls back to its `defaultMessage`.
