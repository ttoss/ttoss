import { Button, Flex, Text } from '@ttoss/ui';
import { Meta, Story } from '@storybook/react';
import React from 'react';
import ReactJson from 'react-json-view';

import { action } from '@storybook/addon-actions';

import { THEME_GLOBAL_KEY } from '../../constants/theme-global';

export default {
  title: 'Theme/Theme Global',
} as Meta;

const Template: Story = (args) => {
  const initialTheme = JSON.parse(localStorage.getItem(THEME_GLOBAL_KEY) || '');
  const [result, setResult] = React.useState<any>(initialTheme);

  const reloadPage = () => location.reload();

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
        onEdit={(e) => setResult(e.updated_src)}
        onAdd={(e) => action('adding key')(e)}
        onDelete={(e) => setResult(e.updated_src)}
        enableClipboard
      />
    </Flex>
  );
};

export const DynamicTheme = Template.bind({});
