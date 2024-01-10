# @ttoss/react-hooks

## 📚 About

**@ttoss/react-hooks** is an easy way to use Utility Hooks in your React application.

## 🚀 Getting Started

### Installing @ttoss/react-hooks

```shell
$ yarn add @ttoss/react-hooks
# or
$ npm install @ttoss/react-hooks
```

## 📄 Usage Examples

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

## 📘 Types

### useScript

```ts
type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

const useScript: (src: string) => {
  status: ScriptStatus;
};
```

### useDebounce

```ts
const useDebounce: <T>(value: T, delay?: number) => T;
```
