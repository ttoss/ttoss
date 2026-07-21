/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { Button, TextField } from '@mui/material';
import { useState } from 'react';

const isValidEmail = (value: string) => {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
};

const App = () => {
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  if (subscribed) {
    return <p>Subscribed</p>;
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (isValidEmail(email)) {
          setSubscribed(true);
        } else {
          setInvalid(true);
        }
      }}
    >
      <TextField
        label="Email"
        value={email}
        error={invalid}
        helperText={invalid ? 'Enter a valid email' : undefined}
        onChange={(event) => {
          setEmail(event.target.value);
          setInvalid(false);
        }}
      />
      <Button type="submit">Subscribe</Button>
    </form>
  );
};

export default App;
