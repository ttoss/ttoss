import { Meta, StoryObj } from '@storybook/react-webpack5';
import { JsonEditor } from '@ttoss/components/JsonEditor';
import { useTheme } from '@ttoss/ui';

import { useThemes } from '../../themes/ThemesProvider';

type Story = StoryObj<typeof JsonEditor>;

const ThemeEditor = () => {
  const { theme } = useTheme();

  const { updateCurrentTheme } = useThemes();

  return (
    <JsonEditor
      data={theme}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setData={(d: any) => {
        return updateCurrentTheme(d);
      }}
    />
  );
};

export default {
  title: 'Design System/Theme',
} as Meta;

export const Theme: Story = {
  render: () => {
    return <ThemeEditor />;
  },
};
