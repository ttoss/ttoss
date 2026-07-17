/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import * as Label from '@radix-ui/react-label';
import { useState } from 'react';

const isValidEmail = (value: string) => {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
};

/**
 * Radix Primitives have no field/validation primitive — the idiomatic
 * pattern is a plain controlled form with @radix-ui/react-label and manual
 * aria wiring.
 */
const App = () => {
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return <p>Subscribed</p>;
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        if (isValidEmail(email)) {
          setSubscribed(true);
        } else {
          setInvalid(true);
        }
      }}
    >
      <Label.Root htmlFor="email">Email</Label.Root>
      <input
        id="email"
        name="email"
        value={email}
        aria-invalid={invalid ? 'true' : undefined}
        aria-describedby={invalid ? 'email-error' : undefined}
        onChange={(event) => {
          setEmail(event.target.value);
          setInvalid(false);
        }}
      />
      {invalid ? <p id="email-error">Enter a valid email</p> : null}
      <button type="submit">Subscribe</button>
    </form>
  );
};

export default App;
