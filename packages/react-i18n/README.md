# @ttoss/react-i18n

**@ttoss/react-i18n** is a React internationalization library built on [FormatJS](https://formatjs.io/) that seamlessly integrates with the ttoss ecosystem. It provides component-level i18n capabilities for translating text elements like buttons, labels, and headings, making your React applications accessible to global audiences.

## Key Features

- **FormatJS Integration**: Built on industry-standard FormatJS with full ICU message format support
- **Dynamic Locale Loading**: Async loading of translation files with automatic caching
- **TypeScript Support**: Full TypeScript definitions for type-safe internationalization
- **Developer Experience**: Simple hooks and components for easy integration
- **ttoss Ecosystem**: Works seamlessly with other ttoss packages and tooling
- **Performance Optimized**: Efficient message loading and rendering with minimal overhead

## When to Use

Choose `@ttoss/react-i18n` for **component-level internationalization** when you need to:

- Translate UI text elements (buttons, labels, form fields, notifications)
- Support multiple languages within React components
- Implement user language switching functionality
- Handle pluralization, number formatting, and date localization

For **routing-level internationalization** (SEO, CMS content, URL localization), consider Next.js built-in i18n features alongside this library.

:::note
Declare your messages following [FormatJS message declaration guidelines](https://formatjs.io/docs/getting-started/message-declaration) for optimal extraction and compilation.
:::

## Installation

```shell
pnpm add @ttoss/react-i18n
pnpm add -D @ttoss/i18n-cli
```

The `@ttoss/i18n-cli` package handles message extraction and compilation. See the [i18n-cli documentation](https://ttoss.dev/docs/modules/packages/i18n-cli/) for complete workflow setup.

## Quick Start

### 1. Provider Setup

Wrap your application with `I18nProvider` and configure locale data loading:

```tsx title="src/main.tsx"
import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider, LoadLocaleData } from '@ttoss/react-i18n';
import App from './App';

const loadLocaleData: LoadLocaleData = async (locale) => {
  switch (locale) {
    case 'pt-BR':
      return (await import('../i18n/compiled/pt-BR.json')).default;
    case 'es':
      return (await import('../i18n/compiled/es.json')).default;
    default:
      return (await import('../i18n/compiled/en.json')).default;
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <I18nProvider locale={navigator.language} loadLocaleData={loadLocaleData}>
    <App />
  </I18nProvider>
);
```

### 2. Component Usage

Use the `useI18n` hook to access internationalization features:

```tsx title="src/App.tsx"
import React, { useState } from 'react';
import { useI18n } from '@ttoss/react-i18n';

export default function App() {
  const { intl, setLocale, locale } = useI18n();
  const [name, setName] = useState('User');

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'pt-BR' : 'en');
  };

  return (
    <div>
      <h1>
        {intl.formatMessage(
          {
            description: 'Welcome message',
            defaultMessage: 'Welcome, {name}!',
          },
          { name }
        )}
      </h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
      />
      <button onClick={toggleLanguage}>
        {intl.formatMessage({
          description: 'Change language button',
          defaultMessage: 'Change Language',
        })}
      </button>
      <p>Current locale: {locale}</p>
    </div>
  );
}
```

## Framework Integration

### Vite Configuration

Configure Vite to properly handle message extraction. Choose between Babel or SWC based on your setup:

#### Option 1: Using Babel (with @ttoss/config)

```ts title="vite.config.ts"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { babelConfig } from '@ttoss/config';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: babelConfig().plugins,
      },
    }),
  ],
});
```

#### Option 2: Using Babel (manual configuration)

First, install the Babel plugin:

```shell
pnpm add -D babel-plugin-formatjs
```

Then configure Vite:

```ts title="vite.config.ts"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            'formatjs',
            {
              idInterpolationPattern: '[sha512:contenthash:base64:6]',
              ast: true,
            },
          ],
        ],
      },
    }),
  ],
});
```

#### Option 3: Using SWC

First, install the SWC plugin:

```shell
pnpm add -D @swc/plugin-formatjs
```

Then configure Vite with SWC:

```ts title="vite.config.ts"
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      plugins: [
        [
          '@swc/plugin-formatjs',
          {
            idInterpolationPattern: '[sha512:contenthash:base64:6]',
            ast: true,
          },
        ],
      ],
    }),
  ],
});
```

#### Configuration Options

- **`idInterpolationPattern`**: Generates unique, deterministic IDs for messages using content hash
- **`ast`**: Enables AST-based extraction for better performance and accuracy

For more configuration options, see:

- [Babel plugin documentation](https://formatjs.github.io/docs/tooling/babel-plugin/)
- [SWC plugin documentation](https://www.npmjs.com/package/@swc/plugin-formatjs)

### Next.js Setup

For Next.js applications, configure the provider in `_app.tsx`:

```tsx title="pages/_app.tsx"
import { I18nProvider, LoadLocaleData } from '@ttoss/react-i18n';
import { useRouter } from 'next/router';
import type { AppProps } from 'next/app';

const loadLocaleData: LoadLocaleData = async (locale) => {
  switch (locale) {
    case 'pt-BR':
      return (await import('../../i18n/compiled/pt-BR.json')).default;
    case 'es':
      return (await import('../../i18n/compiled/es.json')).default;
    default:
      return (await import('../../i18n/compiled/en.json')).default;
  }
};

export default function MyApp({ Component, pageProps }: AppProps) {
  const { locale } = useRouter();

  return (
    <I18nProvider locale={locale} loadLocaleData={loadLocaleData}>
      <Component {...pageProps} />
    </I18nProvider>
  );
}
```

## Advanced Usage

### FormattedMessage Component

Use `FormattedMessage` for declarative message rendering:

```tsx
import { FormattedMessage } from '@ttoss/react-i18n';

function UserStats({ userCount, lastSeen }) {
  return (
    <div>
      <FormattedMessage
        description="Number of users"
        defaultMessage="{count, plural, =0 {No users} =1 {One user} other {# users}}"
        values={{ count: userCount }}
      />
      <FormattedMessage
        description="Last seen timestamp"
        defaultMessage="Last seen: {timestamp, date, short}"
        values={{ timestamp: lastSeen }}
      />
    </div>
  );
}
```

:::warning Library Development
When creating **reusable libraries** that use this package, prefer `intl.formatMessage` over `FormattedMessage` component. During the build process, `FormattedMessage` gets transformed into JSX syntax like `return /* @__PURE__ */jsx(FormattedMessage, { defaultMessage: "..." })`, which prevents the message extraction tool from properly detecting and generating IDs for the messages.

```tsx
// ✅ Good for libraries - extracts correctly
function MyLibraryComponent() {
  const { intl } = useI18n();
  return (
    <div>
      {intl.formatMessage({
        description: 'Library message',
        defaultMessage: 'This message will be extracted correctly',
      })}
    </div>
  );
}

// ❌ Avoid in libraries - extraction may fail
function MyLibraryComponent() {
  return (
    <FormattedMessage
      description="Library message"
      defaultMessage="This may not extract properly in built libraries"
    />
  );
}
```

:::

### Error Handling

Handle translation errors gracefully:

```tsx
import { I18nProvider } from '@ttoss/react-i18n';

function App() {
  const handleTranslationError = (error: Error) => {
    console.warn('Translation error:', error.message);
    // Log to error tracking service
  };

  return (
    <I18nProvider
      locale="en"
      loadLocaleData={loadLocaleData}
      onError={handleTranslationError}
    >
      <MyApp />
    </I18nProvider>
  );
}
```

### Rich Text Formatting

Format messages with embedded components:

```tsx
import { useI18n } from '@ttoss/react-i18n';

function SignupForm() {
  const { intl } = useI18n();

  return (
    <p>
      {intl.formatMessage(
        {
          description: 'Terms and conditions',
          defaultMessage:
            'By signing up, you agree to our {termsLink} and {privacyLink}.',
        },
        {
          termsLink: <a href="/terms">Terms of Service</a>,
          privacyLink: <a href="/privacy">Privacy Policy</a>,
        }
      )}
    </p>
  );
}
```

### Dynamic Locale Loading

Load locales based on user preferences:

```tsx
import { useI18n } from '@ttoss/react-i18n';

function LanguageSelector() {
  const { setLocale, locale } = useI18n();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'pt-BR', name: 'Português' },
    { code: 'es', name: 'Español' },
  ];

  const handleLanguageChange = async (newLocale: string) => {
    // Persist user choice
    localStorage.setItem('preferredLocale', newLocale);
    setLocale(newLocale);
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleLanguageChange(e.target.value)}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
```

## API Reference

### I18nProvider

Main provider component that configures internationalization context.

**Props:**

- `locale?: string` - Initial locale (defaults to browser language)
- `loadLocaleData?: LoadLocaleData` - Function to load translation data
- `onError?: (error: Error) => void` - Error handler for translation issues
- `children: ReactNode` - Child components

```tsx
type LoadLocaleData = (locale: string) => Promise<Messages> | Messages;
type Messages = Record<string, string> | Record<string, MessageFormatElement[]>;
```

### useI18n Hook

Returns internationalization utilities and state.

**Returns:**

```tsx
{
  intl: IntlShape;           // FormatJS intl object
  locale: string;            // Current locale
  defaultLocale: string;     // Default locale ('en')
  setLocale: (locale: string) => void; // Change locale function
  messages?: Messages;       // Current translation messages
}
```

**Example:**

```tsx
const { intl, locale, setLocale } = useI18n();

// Format messages
const greeting = intl.formatMessage({
  description: 'Simple greeting',
  defaultMessage: 'Hello!',
});

// Format with variables
const welcome = intl.formatMessage(
  {
    description: 'Welcome message with name',
    defaultMessage: 'Welcome, {name}!',
  },
  { name: 'John' }
);

// Format numbers and dates
const price = intl.formatNumber(29.99, { style: 'currency', currency: 'USD' });
const date = intl.formatDate(new Date(), { dateStyle: 'medium' });
```

### defineMessages / defineMessage

Type-safe message definition utilities from FormatJS.

```tsx
import { defineMessages, defineMessage } from '@ttoss/react-i18n';

// Single message (recommended pattern)
const errorMessage = defineMessage({
  description: 'Generic error message',
  defaultMessage: 'Something went wrong. Please try again.',
});

// Multiple messages (alternative approach)
const messages = defineMessages({
  title: {
    description: 'Page title',
    defaultMessage: 'My Application',
  },
  subtitle: {
    description: 'Page subtitle',
    defaultMessage: 'Welcome to our platform',
  },
});

// Usage in component
function MyComponent() {
  const { intl } = useI18n();
  return <div>{intl.formatMessage(errorMessage)}</div>;
}
```

:::note
The current ttoss pattern is to define messages inline within components rather than using `defineMessages`. This approach provides better co-location and reduces the need for separate message definitions.
:::

### FormattedMessage

Component for declarative message rendering.

**Props:**

- `id?: string` - Message ID (auto-generated if using defineMessage)
- `defaultMessage: string` - Default message text
- `description?: string` - Message description for translators
- `values?: Record<string, any>` - Interpolation values

```tsx
<FormattedMessage
  description="Item count message"
  defaultMessage="You have {count, plural, =0 {no items} =1 {one item} other {# items}}"
  values={{ count: itemCount }}
/>
```

## Best Practices

### Message Organization

Structure your messages for maintainability:

```tsx
// Inline messages with components (recommended ttoss pattern)
function AuthComponent() {
  const { intl } = useI18n();

  return (
    <div>
      <h1>
        {intl.formatMessage({
          description: 'Login page title',
          defaultMessage: 'Sign In',
        })}
      </h1>
      <button>
        {intl.formatMessage({
          description: 'Login submit button',
          defaultMessage: 'Log In',
        })}
      </button>
      <a href="/forgot-password">
        {intl.formatMessage({
          description: 'Forgot password link',
          defaultMessage: 'Forgot your password?',
        })}
      </a>
    </div>
  );
}

// For reusable messages across components, you can still use defineMessage
import { defineMessage } from '@ttoss/react-i18n';

const successMessage = defineMessage({
  description: 'Success message when user profile is updated',
  defaultMessage: 'Your profile has been successfully updated.',
});

function ProfileForm() {
  const { intl } = useI18n();

  const handleSuccess = () => {
    toast.success(intl.formatMessage(successMessage));
  };

  // ... rest of component
}
```

### Performance Optimization

Optimize loading and rendering:

```tsx
// Lazy load locale data to reduce initial bundle size
const loadLocaleData: LoadLocaleData = async (locale) => {
  const localeModule = await import(`../i18n/compiled/${locale}.json`);
  return localeModule.default;
};

// Use React.memo for components with many translated strings
const TranslatedComponent = React.memo(function TranslatedComponent({ data }) {
  const { intl } = useI18n();

  return (
    <div>
      {data.map((item) => (
        <div key={item.id}>
          {intl.formatMessage(
            {
              description: 'Item title in list',
              defaultMessage: 'Title: {title}',
            },
            { title: item.title }
          )}
        </div>
      ))}
    </div>
  );
});
```

### Locale Detection

Implement intelligent locale detection:

```tsx
function getInitialLocale(): string {
  // 1. Check user preference from localStorage
  const saved = localStorage.getItem('preferredLocale');
  if (saved) return saved;

  // 2. Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const urlLocale = urlParams.get('locale');
  if (urlLocale) return urlLocale;

  // 3. Use browser language with fallback
  const browserLocale = navigator.language;
  const supportedLocales = ['en', 'pt-BR', 'es'];

  return supportedLocales.includes(browserLocale) ? browserLocale : 'en';
}
```

## Troubleshooting

### Common Issues

**Missing translation warnings:**

```
MessageError: MISSING_TRANSLATION
```

- Ensure all locales have corresponding translation files
- Check that message IDs match between code and translation files
- Use `onError` prop to handle gracefully

**Babel plugin not working:**

```
Messages not being extracted during build
```

- Verify `@ttoss/config` babel plugins are configured correctly
- Check that message definitions use inline `intl.formatMessage` calls
- Ensure babel configuration is applied to your build process

**Locale not switching:**

```
setLocale called but UI doesn't update
```

- Verify `loadLocaleData` function returns correct translation data
- Check browser console for loading errors
- Ensure `I18nProvider` is at the correct level in component tree

### Development Tips

Enable verbose logging during development:

```tsx
const loadLocaleData: LoadLocaleData = async (locale) => {
  console.log(`Loading locale: ${locale}`);
  try {
    const data = (await import(`../i18n/compiled/${locale}.json`)).default;
    console.log(`Loaded ${Object.keys(data).length} messages for ${locale}`);
    return data;
  } catch (error) {
    console.error(`Failed to load locale ${locale}:`, error);
    throw error;
  }
};
```

## Related Resources

### ttoss Ecosystem

- **[@ttoss/i18n-cli](https://ttoss.dev/docs/modules/packages/i18n-cli/)** - Extract and compile translations using FormatJS workflow
- **[@ttoss/forms](https://ttoss.dev/docs/modules/packages/forms/)** - Form components with built-in i18n support
- **[@ttoss/ui](https://ttoss.dev/docs/modules/packages/ui/)** - UI components that work seamlessly with react-i18n

### External Resources

- **[FormatJS Documentation](https://formatjs.io/)** - Complete guide to ICU message format and FormatJS features
- **[ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)** - Specification for message formatting
- **[Building a Multilingual Blog with Next.js and @ttoss/react-i18n](https://ttoss.dev/blog/2023/09/26/building-a-multilingual-blog-site-with-next.js-and-@ttoss-react-i18n)** - Comprehensive tutorial

This library enables efficient internationalization following FormatJS standards while integrating seamlessly with the ttoss development ecosystem. For complete workflow setup including message extraction and compilation, see the [@ttoss/i18n-cli documentation](https://ttoss.dev/docs/modules/packages/i18n-cli/).
