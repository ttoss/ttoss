/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import { createTheme } from '@ttoss/fsl-theme';
import { ThemeProvider } from '@ttoss/fsl-theme/react';
import { Button, Switch } from '@ttoss/fsl-ui';
import { useState } from 'react';

const theme = createTheme();

const SettingsCard = () => {
  const [saved, setSaved] = useState(false);

  return (
    <section>
      <h2>Notification settings</h2>
      <p>Choose how you want to hear from us.</p>
      <Switch defaultSelected>Email notifications</Switch>
      <Button
        evaluation="primary"
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

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <SettingsCard />
    </ThemeProvider>
  );
};

export default App;
