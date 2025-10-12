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

| Option                    | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| `--no-compile`            | Extract only, skip compilation step                                      |
| `--ignore-ttoss-packages` | Skip extraction from ttoss dependencies                                  |
| `--pattern <glob>`        | Custom file pattern for extraction (default: `src/**/*.{js,jsx,ts,tsx}`) |
| `--ignore <patterns>`     | Files/patterns to ignore during extraction                               |

## Integration with ttoss Ecosystem

When using ttoss packages like [@ttoss/react-i18n](https://ttoss.dev/docs/modules/packages/react-i18n/), the CLI automatically:

- Extracts translations from installed ttoss packages
- Merges them with your application translations
- Provides unified translation management

This eliminates manual copying of package translations and ensures consistency across your application.
