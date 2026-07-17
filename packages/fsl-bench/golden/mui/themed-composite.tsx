/* eslint-disable -- benchmark fixture: this file's validator is the fsl-bench gauntlet (compile → render → behavior → semantic lint); repo lint autofixes would corrupt the calibration */
import {
  Button,
  Card,
  CardContent,
  createTheme,
  FormControlLabel,
  Switch,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { useState } from 'react';

const theme = createTheme();

const SettingsCard = () => {
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <CardContent>
        <Typography component="h2" variant="h5">
          Notification settings
        </Typography>
        <Typography color="text.secondary">
          Choose how you want to hear from us.
        </Typography>
        <FormControlLabel
          control={<Switch defaultChecked />}
          label="Email notifications"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            setSaved(true);
          }}
        >
          Save preferences
        </Button>
        {saved ? <Typography>Preferences saved</Typography> : null}
      </CardContent>
    </Card>
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
