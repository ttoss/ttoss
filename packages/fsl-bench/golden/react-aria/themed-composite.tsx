/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, Switch } from 'react-aria-components';

/**
 * React Aria Components ship unstyled and have no theme provider — design
 * tokens are defined once as CSS custom properties and consumed via var().
 */
const themeTokens = {
  '--color-surface': '#ffffff',
  '--color-text': '#1a1a2e',
  '--color-primary': '#2563eb',
  '--color-primary-text': '#ffffff',
} as CSSProperties;

const App = () => {
  const [saved, setSaved] = useState(false);

  return (
    <section
      style={{
        ...themeTokens,
        background: 'var(--color-surface)',
        color: 'var(--color-text)',
      }}
    >
      <h2>Notification settings</h2>
      <p>Choose how you want to hear from us.</p>
      <Switch defaultSelected>Email notifications</Switch>
      <Button
        style={{
          background: 'var(--color-primary)',
          color: 'var(--color-primary-text)',
        }}
        onPress={() => {
          setSaved(true);
        }}
      >
        Save preferences
      </Button>
      {saved ? <p>Preferences saved</p> : null}
    </section>
  );
};

export default App;
