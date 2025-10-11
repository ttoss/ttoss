import { Meta, StoryObj } from '@storybook/react-webpack5';
import { JsonEditor } from '@ttoss/components/JsonEditor';
import { useTheme } from '@ttoss/ui';
import * as React from 'react';

type Story = StoryObj<typeof JsonEditor>;

const ThemeJsonTemplate = () => {
  const { theme } = useTheme();

  return <JsonEditor data={theme} />;
};

const BasicExample = () => {
  const [data, setData] = React.useState({
    name: 'John Doe',
    age: 30,
    settings: {
      theme: 'dark',
      notifications: true,
    },
    hobbies: ['reading', 'coding', 'music'],
  });

  const handleDataChange = (newData: unknown) => {
    setData(newData as typeof data);
  };

  return <JsonEditor data={data} setData={handleDataChange} />;
};

export default {
  title: 'Components/JsonEditor',
  component: JsonEditor,
  parameters: {
    docs: {
      description: {
        component:
          'JSON editor component with syntax highlighting and validation. Built on top of json-edit-react.',
      },
    },
  },
} as Meta<typeof JsonEditor>;

export const Basic: Story = {
  render: () => {
    return <BasicExample />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Basic usage with editable JSON data.',
      },
    },
  },
};

export const ThemeJson: Story = {
  render: () => {
    return <ThemeJsonTemplate />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Displaying the current theme configuration as JSON.',
      },
    },
  },
};
