import { Meta, StoryObj } from '@storybook/react-webpack5';
import { SpotlightCard } from '@ttoss/ui';
import { Box } from '@ttoss/ui';

const meta: Meta<typeof SpotlightCard> = {
  title: 'UI/SpotlightCard',
  component: SpotlightCard,
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    description: { control: 'text' },
    primaryLabel: { control: 'text' },
    secondaryLabel: { control: 'text' },
    onPrimaryClick: { action: 'primary clicked' },
    onSecondaryClick: { action: 'secondary clicked' },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SpotlightCard>;

/**
 * Default Story: With both buttons active.
 */
export const Default: Story = {
  args: {
    title: 'OneClick',
    subtitle: 'Tracking',
    description:
      'Understand the purpose and how to use OneClick Tracking to maximize your conversion tracking across multiple platforms.',
    primaryLabel: 'Watch Tutorial',
    secondaryLabel: 'Read Article',
    iconName: 'AdsClick',
    iconSymbol: 'material-symbols:ads-click',
  },
};

/**
 * Variation with NO buttons.
 * Useful for informational banners.
 */
export const NoButtons: Story = {
  args: {
    ...Default.args,
    description:
      'This banner serves only as information or a highlight without direct actions available at the moment.',
    primaryLabel: undefined,
    secondaryLabel: undefined,
  },
};

/**
 * Variation with ONLY Primary button.
 */
export const OnlyPrimaryButton: Story = {
  args: {
    ...Default.args,
    primaryLabel: 'Watch Tutorial',
    secondaryLabel: undefined,
  },
};

/**
 * Variation with ONLY Secondary button.
 */
export const OnlySecondaryButton: Story = {
  args: {
    ...Default.args,
    primaryLabel: undefined,
    secondaryLabel: 'Read Documentation',
  },
};

/**
 * Example of another context (Finance Dashboard).
 */
export const FinanceDashboardContext: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Finance',
    description:
      'Track your earnings and dividends in real time with advanced charts.',
    primaryLabel: 'View Demo',
    secondaryLabel: 'Documentation',
    iconName: 'AttachMoney',
    iconSymbol: 'material-symbols:attach-money',
  },
};

/**
 * Responsive behavior test (Scroll).
 */
export const ScrollTest: Story = {
  render: (args) => {
    return (
      <Box
        sx={{
          width: '800px',
          border: '2px dashed #ccc',
          overflowX: 'auto',
          p: 4,
        }}
      >
        <SpotlightCard {...args} />
      </Box>
    );
  },
  args: {
    ...Default.args,
  },
};
