# @ttoss/hooks

## 📚 About

<strong> @ttoss/hooks</strong> is a easiest way to use Util Hooks in your React application.

## 🚀 Get Started

### Install @ttoss/hooks

```shell
$ yarn add @ttoss/hooks
# or
$ npm install @ttoss/hooks
```

## 📄 Examples of use

```tsx
import React from 'react';

import { useScript } from '@ttoss/hooks';

export const Component = () => {
  const url = 'https://your-domain.com/bundle-api.js';

  const { status } = useScript(url);

  return <div>{status === 'ready' ? 'Ok' : 'Loading'}</div>;
};
```

## 📘 Types

```ts
type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

const useScript: (src: string) => {
  status: ScriptStatus;
};
```
