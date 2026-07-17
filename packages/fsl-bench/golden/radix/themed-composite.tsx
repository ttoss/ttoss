/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import * as Label from '@radix-ui/react-label';
import * as Switch from '@radix-ui/react-switch';
import { useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * Radix Primitives ship unstyled and have no theme provider — design tokens
 * are defined once as CSS custom properties and consumed via var().
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
      <Label.Root htmlFor="email-notifications">Email notifications</Label.Root>
      <Switch.Root id="email-notifications" defaultChecked>
        <Switch.Thumb />
      </Switch.Root>
      <button
        type="button"
        style={{
          background: 'var(--color-primary)',
          color: 'var(--color-primary-text)',
        }}
        onClick={() => {
          setSaved(true);
        }}
      >
        Save preferences
      </button>
      {saved ? <p>Preferences saved</p> : null}
    </section>
  );
};

export default App;
