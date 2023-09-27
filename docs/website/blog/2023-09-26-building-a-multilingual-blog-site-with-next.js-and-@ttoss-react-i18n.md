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

## Two Facets of i18n in Next.js

Before we dive into the nitty-gritty, let's establish an essential distinction within Next.js's i18n capabilities:

### **1. Next.js-Integrated i18n for Routing**

**Why It Matters:** This mode focuses on managing different language versions of your website at the routing level. It's invaluable when you need to handle multilingual content that goes beyond simple text changes. For instance, if you're running a Content Management System (CMS) and want to optimize for Search Engine Optimization (SEO) with language-specific metadata, this approach is your go-to.

**What It Solves:** This mode efficiently manages routes and server-side rendering for distinct locales. However, when it comes to straightforward text translation, it may fall short.

### **2. Component-Level i18n with @ttoss/react-i18n and @ttoss/i18n-cli**

**Why It Matters:** Here, we move inside the components themselves, addressing the finer details of internationalization. This approach is perfect for scenarios where you need to translate simple text elements like buttons, labels, and headings, making your site more user-friendly.

**What It Solves:** The Component-Level i18n enables you to tackle those everyday translation needs. For example, switching "Submit" to "Submeter" in a form.

## Prerequisites

Before we get started, make sure you have Node.js and npm (or yarn or pnpm) installed on your system.

## Setting Up a Next.js Project

To create a new Next.js project, run the following command:

```bash
npx create-next-app my-blog
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

## Routing with Next.js i18n

Let's first explore the robust routing capabilities that Next.js offers for internationalization. This method is indispensable when your website's multilingual needs extend to intricate content variations, such as managing a CMS or optimizing for SEO.

In this mode:

- You can efficiently handle routes for different locales, ensuring that users are directed to the appropriate language versions of your pages.
- Server-side rendering takes care of delivering pre-rendered pages, optimizing the performance and SEO of your site.
- Metadata and SEO parameters can be tailored for each language, elevating your website's search engine visibility.

But here's the catch: while it excels at managing routes and complex content, this approach may not be the most efficient for handling straightforward text translation needs. For example, changing a simple button label from "Submit" to "Submeter" across the site may become cumbersome.

## Component-Level i18n with @ttoss/react-i18n

Now, let's zoom in on the component-level internationalization. This aspect of i18n focuses on addressing those everyday translation requirements, allowing you to effortlessly switch text elements within your components.

Here's why this approach shines:

- It enables you to handle simple text changes throughout your website with ease. For instance, translating buttons, labels, and headings is a breeze.
- Users experience a more intuitive interface, as common text elements are seamlessly translated into their preferred language.

So, whether you're dealing with a call-to-action button or a form label, Component-Level i18n with `@ttoss/react-i18n` and `@ttoss/i18n-cli` has you covered.

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

Add these script command to your project's package.json:

```json
"scripts": {
  "i18n": "ttoss-i18n"
},
```

The last step is where the magic happens. First, you need to extract all the texts that have been added using `intl` from `useI18n` by running the `pnpm run i18n` command. Then, all the extracted texts will be added to the file you defined as the `defaultLocale` in `next.config.js`.

Now you need to duplicate this file for the other languages and translate them. When you finish translating, run again the `pnpm run i18n` command to compile all the languages. This command will create a folder called `compiled` inside `i18n` folder with the translations that are gonna be used by `@ttoss/react-i18n` lib to show the correct language on screen.

## Conclusion

In this journey through Next.js and `@ttoss/react-i18n`, we've explored the two facets of internationalization that can transform your website into a multilingual masterpiece.

- **Routing with Next.js i18n** is your go-to when you need to manage complex content variations, optimize SEO, and handle metadata intricacies. It's a powerful choice for scenarios like CMS-driven websites.

- **Component-Level i18n** steps in to effortlessly manage those everyday translation needs. It makes tasks like changing button labels, form fields, and headings in your components a breeze, enhancing your website's user-friendliness.

By understanding and implementing both aspects of i18n, you'll have the tools needed to create inclusive and impactful multilingual websites that cater to a global audience.
