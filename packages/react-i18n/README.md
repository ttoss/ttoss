# @ttoss/react-i18n

**@ttoss/react-i18n** is a library that provides a way to internationalize your React application using ttoss ecosystem.

:::note
You should declare your messages as describe in the [FormatJS](https://formatjs.io/docs/getting-started/message-declaration) documentation.
:::

## Get Started

### Install @ttoss/react-i18n

```shell
pnpm add @ttoss/react-i18n
pnpm add -D @ttoss/i18n-cli
```

To extract and compile your translations, check the [ttoss/i18n-cli](/docs/modules/packages/i18n-cli/) documentation.

## Examples of use

### index.tsx

Import the `I18nProvider` and wrap your application with it. Add to it a function called `loadLocaleData` to load all the translation data.

```tsx title="src/index.tsx"
import { I18nProvider, LoadLocaleData } from '@ttoss/react-i18n';

const loadLocaleData: LoadLocaleData = async (locale) => {
  switch (locale) {
    case 'pt-BR':
      return import('../i18n/compiled/pt-BR.json');
    default:
      return import('../i18n/compiled/en.json');
  }
};

ReactDOM.render(
  <I18nProvider
    locale={window.navigator.language}
    loadLocaleData={loadLocaleData}
  >
    <App />
  </I18nProvider>,
  document.getElementById('root')
);
```

### App.tsx

Then import the useI18n hook and extract the intl, to get access to the `formatMessage` function and many others (using `defineMessages` is optional).

```tsx title="src/App.tsx"
import { useI18n, defineMessages } from '@ttoss/react-i18n';

const messages = defineMessages({
  myNameIs: {
    description: 'My name is',
    defaultValue: 'My name is {name}',
  },
});

const App = () => {
  const { intl, setLocale } = useI18n();

  const [name, setName] = React.useState('Rayza');

  return (
    <div>
      <div>
        <button onClick={() => setLocale('en-US')}>en-US</button>

        <button onClick={() => setLocale('pt-BR')}>pt-BR</button>
      </div>

      <input value={name} onChange={(e) => setName(e.target.value)} />

      <h3>{intl.formatMessage(messages.myNameIs, { name })}</h3>
    </div>
  );
};

export default App;
```

### Configuring Vite

In order to inject the i18n id's properly on the code, configure the `plugins` section of `vite.config.ts` according to this:

```ts
import { babelConfig } from '@ttoss/config';

export default defineConfig(async () => {
  return {
    // ...

    plugins: [
      react({
        babel: {
          plugins: babelConfig().plugins,
        },
      }),
    ],
  };

  // ...
});
```
