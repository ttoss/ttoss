---
title: 'Building a Multilingual Blog Site with Next.js and @ttoss/react-i18n'
description: Learn how to build a multilingual blog site using Next.js routing and @ttoss/react-i18n for component-level internationalization. This tutorial covers both approaches to i18n, helping you choose the right strategy for your project needs.
authors:
  - rayza
tags:
  - i18n
  - nextjs
  - typescript
  - internationalization
  - multilingual
  - localization
---

Building websites for global audiences requires effective internationalization (i18n) strategies. This tutorial demonstrates how to create a multilingual blog site using Next.js and @ttoss/react-i18n, covering both routing-level and component-level internationalization approaches.

You'll learn when to use each approach, how to implement them together, and build a complete workflow for managing translations in your Next.js applications.

<!-- truncate -->

## Two Approaches to i18n in Next.js

Next.js applications benefit from combining two complementary internationalization strategies:

### Routing-Level i18n (Next.js Built-in)

**Best for**: SEO optimization, CMS content, URL localization, and server-side rendering requirements.

Next.js handles route management and server-side rendering for different locales, making it ideal for:

- Multi-language URL structures (`/en/blog` vs `/pt-br/blog`)
- SEO metadata localization
- Static content from CMS systems
- Server-side performance optimization

### Component-Level i18n (@ttoss/react-i18n)

**Best for**: UI text elements, form labels, buttons, and dynamic content translation.

@ttoss/react-i18n handles in-component text translation, perfect for:

- Button labels, form fields, and navigation text
- User interface elements that change dynamically
- Client-side language switching
- Formatted numbers, dates, and pluralization

**Combined Power**: Use both approaches together—Next.js for routing and static content, @ttoss/react-i18n for interactive UI elements.

## Project Setup

### 1. Create Next.js Project

```bash
npx create-next-app@latest my-multilingual-blog --typescript
cd my-multilingual-blog
```

### 2. Install Dependencies

```bash
pnpm add @ttoss/react-i18n
pnpm add -D @ttoss/i18n-cli
```

### 3. Configure Next.js i18n

Create or update `next.config.js`:

```js title="next.config.js"
module.exports = {
  i18n: {
    locales: ['en', 'pt-BR', 'es'],
    defaultLocale: 'en',
    localeDetection: false, // Allows manual language switching
  },
};
```

### 4. Setup I18nProvider

Configure the provider in `pages/_app.tsx`:

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

## Creating Internationalized Components

Now you can use @ttoss/react-i18n to create components with translatable text:

```tsx title="components/BlogPost.tsx"
import { useI18n } from '@ttoss/react-i18n';

interface BlogPostProps {
  title: string;
  content: string;
  publishedAt: Date;
}

export default function BlogPost({
  title,
  content,
  publishedAt,
}: BlogPostProps) {
  const { intl } = useI18n();

  return (
    <article>
      <h2>{title}</h2>
      <p className="meta">
        {intl.formatMessage(
          {
            description: 'Blog post publication date',
            defaultMessage: 'Published on {date}',
          },
          {
            date: intl.formatDate(publishedAt, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          }
        )}
      </p>
      <div className="content">{content}</div>
      <footer>
        <button>
          {intl.formatMessage({
            description: 'Share blog post button',
            defaultMessage: 'Share this post',
          })}
        </button>
      </footer>
    </article>
  );
}
```

## Language Switching Component

Create a language selector that works with both Next.js routing and @ttoss/react-i18n:

```tsx title="components/LanguageSelector.tsx"
import { useI18n } from '@ttoss/react-i18n';
import { useRouter } from 'next/router';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'pt-BR', name: 'Português' },
  { code: 'es', name: 'Español' },
];

export default function LanguageSelector() {
  const { intl, setLocale } = useI18n();
  const router = useRouter();

  const handleLanguageChange = (newLocale: string) => {
    // Update @ttoss/react-i18n state
    setLocale(newLocale);

    // Update Next.js route
    router.push(router.asPath, router.asPath, {
      locale: newLocale,
      shallow: true,
    });
  };

  return (
    <div>
      <label>
        {intl.formatMessage({
          description: 'Language selector label',
          defaultMessage: 'Select language:',
        })}
      </label>
      <select
        value={router.locale}
        onChange={(e) => handleLanguageChange(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Translation Workflow

### 1. Setup Translation Scripts

Add the i18n script to your `package.json`:

```json title="package.json"
{
  "scripts": {
    "i18n": "ttoss-i18n",
    "i18n:extract": "ttoss-i18n --no-compile"
  }
}
```

### 2. Extract Messages

Extract all translatable messages from your components:

```bash
pnpm run i18n:extract
```

This creates `i18n/lang/en.json` with all extracted messages:

```json title="i18n/lang/en.json"
{
  "blog-post-publication-date": {
    "defaultMessage": "Published on {date}",
    "description": "Blog post publication date"
  },
  "share-blog-post-button": {
    "defaultMessage": "Share this post",
    "description": "Share blog post button"
  },
  "language-selector-label": {
    "defaultMessage": "Select language:",
    "description": "Language selector label"
  }
}
```

### 3. Create Translations

Copy and translate the base file for each locale:

```bash
# Create translation files
cp i18n/lang/en.json i18n/lang/pt-BR.json
cp i18n/lang/en.json i18n/lang/es.json
```

Edit each translation file:

```json title="i18n/lang/pt-BR.json"
{
  "blog-post-publication-date": {
    "defaultMessage": "Publicado em {date}",
    "description": "Blog post publication date"
  },
  "share-blog-post-button": {
    "defaultMessage": "Compartilhar post",
    "description": "Share blog post button"
  },
  "language-selector-label": {
    "defaultMessage": "Selecionar idioma:",
    "description": "Language selector label"
  }
}
```

### 4. Compile Translations

Compile all translations for production:

```bash
pnpm run i18n
```

This generates optimized files in `i18n/compiled/` that your application will load.

### 5. Folder Structure

Your final i18n folder structure:

```
i18n/
├── lang/           # Source translation files (edit these)
│   ├── en.json
│   ├── pt-BR.json
│   └── es.json
├── compiled/       # Generated files (used by app)
│   ├── en.json
│   ├── pt-BR.json
│   └── es.json
└── missing/        # Missing translations (generated)
```

Add to `.gitignore`:

```gitignore
i18n/compiled/
i18n/missing/
```

## Next Steps

### Production Considerations

- **Performance**: Translation files are loaded asynchronously and cached automatically
- **SEO**: Next.js i18n handles URL structure and metadata for search engines
- **Accessibility**: Use `lang` attributes on HTML elements for screen readers
- **Testing**: Test language switching and content rendering across all supported locales

### Advanced Features

- **Pluralization**: Handle complex plural rules using ICU message format
- **Number/Date Formatting**: Locale-specific formatting for currencies, dates, and numbers
- **Rich Text**: Embed React components within translated messages
- **Lazy Loading**: Load translations on-demand to optimize bundle size

## Conclusion

Combining Next.js routing-level i18n with @ttoss/react-i18n component-level translation creates a powerful, flexible internationalization solution:

- **Next.js i18n** handles SEO, routing, and static content translation
- **@ttoss/react-i18n** manages dynamic UI text, user interactions, and client-side formatting
- **@ttoss/i18n-cli** streamlines the extraction and compilation workflow

This dual approach enables you to build scalable multilingual applications that provide excellent user experience and search engine optimization.

## Related Resources

- **[@ttoss/react-i18n Documentation](https://ttoss.dev/docs/modules/packages/react-i18n/)** - Complete API reference and advanced usage patterns
- **[@ttoss/i18n-cli Documentation](https://ttoss.dev/docs/modules/packages/i18n-cli/)** - Message extraction and compilation workflow
- **[Next.js Internationalization](https://nextjs.org/docs/advanced-features/i18n-routing)** - Official Next.js i18n routing documentation
- **[FormatJS Documentation](https://formatjs.io/)** - ICU message format and advanced formatting features
