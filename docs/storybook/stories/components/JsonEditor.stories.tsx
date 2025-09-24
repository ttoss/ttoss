import { Meta, StoryObj } from '@storybook/react-webpack5';
import { JsonEditor } from '@ttoss/components/JsonEditor';
import { useTheme } from '@ttoss/ui';

type Story = StoryObj<typeof JsonEditor>;

const ThemeJsonTemplate = () => {
  const { theme } = useTheme();

  return <JsonEditor data={theme} />;
};

export default {
  title: 'Components/JsonEditor',
  component: JsonEditor,
} as Meta<typeof JsonEditor>;

export const ThemeJson: Story = {
  render: () => {
    return <ThemeJsonTemplate />;
  },
};
