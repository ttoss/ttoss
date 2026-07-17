/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { useState } from 'react';
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from 'react-aria-components';

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
    <Form
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
        value={email}
        isInvalid={invalid}
        onChange={(value) => {
          setEmail(value);
          setInvalid(false);
        }}
      >
        <Label>Email</Label>
        <Input />
        <FieldError>Enter a valid email</FieldError>
      </TextField>
      <Button type="submit">Subscribe</Button>
    </Form>
  );
};

export default App;
