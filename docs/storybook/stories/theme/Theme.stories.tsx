import * as React from 'react';
import { Button, Flex, Text, Theme } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import { THEME_GLOBAL_KEY } from '../../constants/theme-global';
import { action } from '@storybook/addon-actions';
import ReactJson from 'react-json-view';

export default {
  title: 'Theme/Theme Global',
} as Meta;

const Template: Story = () => {
  const initialTheme = JSON.parse(localStorage.getItem(THEME_GLOBAL_KEY) || '');
  const [result, setResult] = React.useState<Theme>(initialTheme);

  const reloadPage = () => {
    return location.reload();
  };

  const handleUpdate = () => {
    localStorage.setItem(THEME_GLOBAL_KEY, JSON.stringify(result));
    reloadPage();
  };

  const handleReset = () => {
    const willReset = confirm("Are you sure reset theme? It's irreversible!");

    if (!willReset) {
      return;
    }

    localStorage.removeItem(THEME_GLOBAL_KEY);
    reloadPage();
  };

  return (
    <Flex sx={{ flexDirection: 'column' }}>
      <Text sx={{ marginBottom: 3 }}>Update here the Dynamic theme</Text>

      <Flex sx={{ gap: 3, marginBottom: 4 }}>
        <Button onClick={handleUpdate}>Update theme</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset theme
        </Button>
      </Flex>

      <ReactJson
        name="dynamicTheme"
        src={result}
        onEdit={(e) => {
          return setResult(e.updated_src);
        }}
        onAdd={(e) => {
          return action('adding key')(e);
        }}
        onDelete={(e) => {
          return setResult(e.updated_src);
        }}
        enableClipboard
      />
    </Flex>
  );
};

export const DynamicTheme = Template.bind({});
