# @ttoss/react-hooks

## 📚 About

**@ttoss/react-hooks** is a collection of custom React hooks that can be used to simplify the development of React applications.

## Installation

```bash
pnpm add @ttoss/react-hooks
```

## API

### useDebounce

The `useDebounce` hook is used to delay the update of a value for a specific amount of time.

```tsx
import React, { useState } from 'react';
import { useDebounce } from '@ttoss/react-hooks';

export const DebouncedInputComponent = () => {
  const [inputValue, setInputValue] = useState('');
  const debouncedValue = useDebounce(inputValue, 500);

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="Type to search..."
    />
  );
};
```

### useLocalStorage

The `useLocalStorage` hook is used to store and retrieve values from the local storage.

```tsx
import * as React from 'react';
import { useLocalStorage } from '@ttoss/react-hooks';

export const LocalStorageComponent = () => {
  const [value, setValue] = useLocalStorage('key', 'default value');

  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type to save..."
      />
    </div>
  );
};
```

It uses the `localStorage` storage by default, but you can also use the `sessionStorage` storage by passing the `Storage` option.

```tsx
const [value, setValue] = useLocalStorage('key', 'default value', {
  storage: window.sessionStorage,
});
```

### useScript

The `useScript` hook is used to load external scripts into your React component.

```tsx
import React from 'react';
import { useScript } from '@ttoss/react-hooks';

export const ComponentWithScript = () => {
  const url = 'https://your-domain.com/bundle-api.js';
  const { status } = useScript(url);

  return <div>{status === 'ready' ? 'Script loaded' : 'Loading'}</div>;
};
```
