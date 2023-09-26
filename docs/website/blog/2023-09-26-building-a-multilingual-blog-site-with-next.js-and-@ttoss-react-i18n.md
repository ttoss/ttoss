---
title: 'Building a Multilingual Blog Site with Next.js and @ttoss/react-i18n'
description: In this comprehensive tutorial, we will guide you through the process of building a multilingual blog site using Next.js and the powerful @ttoss/react-i18n library. Internationalization (i18n) is a crucial aspect of modern web development, especially when targeting a diverse global audience. You will learn how to set up a Next.js project, integrate i18n support, configure locales, create localized components, and enable users to seamlessly switch between languages. Additionally, we'll cover the extraction and compilation of translations, ensuring that your blog site is accessible and engaging for users from various language backgrounds. By the end of this tutorial, you'll have the skills to create a dynamic and inclusive multilingual blog site that caters to a worldwide readership.
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

Internationalization (i18n) is an essential part of building modern websites, especially for those aiming to reach a global audience. In this tutorial, we will explore how to create a multilingual blog site using Next.js and the @ttoss/i18n library. This combination will allow us to provide an engaging reading experience for users in different languages.

## Prerequisites

Before we get started, make sure you have Node.js and npm (or yarn or pnpm) installed on your system.

## Setting Up a Next.js Project

To create a new Next.js project, run the following command:

```bash
npx create-next-app@12 my-blog
cd my-blog
```

## Adding @ttoss/react-i18n

Let's integrate `@ttoss/react-i18n` into our project:

```bash
npm install @ttoss/react-i18n
# or
yarn add @ttoss/react-i18n
# or
pnpm install @ttoss/react-i18n
```

## Configuring Locales

In the root folder of your project, create a subfolder named `i18n`. Inside this folder, create a folder named `lang` with files `en-US.json` and `pt-BR.json` as shown below.

**public/locales/en-US.json**:

```json
{}
```

**public/locales/pt-BR.json**:

```json
{}
```

## Configuring Next.js

This configuration defines the available languages in your application and sets the default language to `en-US`. Now, Next.js will use this configuration to handle server-side internationalization.

```jsx
// next.config.js

module.exports = {
  i18n: {
    locales: ['en-US', 'pt-BR'],
    defaultLocale: 'en-US',
    // This `localeDetection` property is optional.
    // When set to false, you can freely switch between locales.
    localeDetection: false,
  },
};
```

## Configuring the `I18nProvider`

In your `_app.js` file inside the `pages` folder, import and configure the `I18nProvider` to provide internationalization support. The file should look like this:

**pages/\_app.ts**:

```jsx
import { I18nProvider, LoadLocaleData } from "@ttoss/react-i18n";
import { useRouter } from "next/router";

const loadLocaleData: LoadLocaleData = (locale) => {
  switch (locale) {
    case "pt-BR":
      return import("../../i18n/compiled/pt-BR.json");
    default:
      return import("../../i18n/compiled/en-US.json");
  }
};

function MyApp({ Component, pageProps }) {
  const { locale } = useRouter();
  return (
    <I18nProvider locale={locale} loadLocaleData={loadLocaleData}>
      <Component {...pageProps} />
    </I18nProvider>
  );
}

export default MyApp;
```

## Creating Localized Components

Now, we can use the library to write text that will be extracted and translated later. For example, to create a blog post component:

```jsx
import { useI18n } from '@ttoss/react-i18n';

function BlogPost() {
  const { intl } = useI18n();

  return (
    <div>
      <h2>
        {intl.formatMessage({
          description: 'My blog post title',
          defaultMessage: 'How to work with translation on nextjs projects',
        })}
      </h2>
      <p>
        {intl.formatMessage({
          description: 'My blog post content',
          defaultMessage: 'Here, you can type all content',
        })}
      </p>
    </div>
  );
}

export default BlogPost;
```

## Dynamic Pages with Next.js

If we want to create dynamic pages for each blog post, we can use Next.js for that. Create a `posts` folder inside the `pages` folder, and inside it, create files like `post-1.js`, `post-2.js`, and so on. In each of these files, we can use the `BlogPost` component we created earlier to render the content.

## Switching Language

Now, we can add a language selector to our site, allowing users to choose their preferred language. If you have the `localeDetection: true` option in `next.config.js`, when switching the language, Next.js will automatically update the route, and the `I18nProvider` will take care of displaying the content in the correct language. If this property is set to `false`, you can do it as follows:

```tsx
import { useI18n } from '@ttoss/react-i18n';
import { useRouter } from 'next/router';

function LanguageSelector() {
  const { intl, setLocale } = useI18n();
  const router = useRouter();

  const handleChangeLanguage = (locale: string) => {
    setLocale(locale);

    router.push(router.asPath, router.asPath, {
      locale,
      shallow: true,
    });
  };

  return (
    <div>
      <select onChange={(e) => handleChangeLanguage(e.target.value)}>
        <option value="en-US">English</option>
        <option value="pt-BR">Portuguese</option>
      </select>
    </div>
  );
}

export default LanguageSelector;
```

## Extracting Texts and Compiling Translations

Add these script commands to your project's package.json:

```json
"scripts": {
  "compile": "pnpm run compile:en && pnpm run compile:pt",
  "compile:en": "formatjs compile i18n/lang/en-US.json --ast --out-file i18n/compiled/en-US.json",
  "compile:pt": "formatjs compile i18n/lang/pt-BR.json --ast --out-file i18n/compiled/pt-BR.json",
  "i18n": "ttoss-i18n",
},
```

The last step is where the magic happens. First, you need to extract all the texts that have been added using `intl` from `useI18n` by running the `pnpm run i18n` command. Then, all the extracted texts will be added to the file you defined as the `defaultLocale` in `next.config.js`.

Now you need to duplicate this file for the other languages and translate them. When you finish translating, run the `pnpm run compile` command to compile all the languages.

## Conclusion

By following this tutorial, you've learned how to build an engaging multilingual blog site using Next.js and `@ttoss/react-i18n`. This approach not only provides a personalized reading experience for your users but also demonstrates a commitment to global accessibility. Continue exploring internationalization possibilities in your projects to create more inclusive and impactful experiences.
