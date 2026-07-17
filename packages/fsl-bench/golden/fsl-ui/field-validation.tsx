/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import {
  Form,
  FormActions,
  FormSubmit,
  TextField,
  TextFieldControl,
  TextFieldError,
  TextFieldLabel,
} from '@ttoss/fsl-ui';
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
        isInvalid={invalid}
        value={email}
        onChange={(value) => {
          setEmail(value);
          setInvalid(false);
        }}
      >
        <TextFieldLabel>Email</TextFieldLabel>
        <TextFieldControl />
        <TextFieldError>Enter a valid email</TextFieldError>
      </TextField>
      <FormActions>
        <FormSubmit>Subscribe</FormSubmit>
      </FormActions>
    </Form>
  );
};

export default App;
