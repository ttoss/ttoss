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
    tutorialLabel: { control: 'text' },
    articleLabel: { control: 'text' },
    onTutorialClick: { action: 'tutorial clicked' },
    onArticleClick: { action: 'article clicked' },
  },
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SpotlightCard>;

/**
 * Default Story: Simulates real usage in the OneClick product.
 * All props are passed explicitly.
 */
export const Default: Story = {
  args: {
    title: 'OneClick',
    subtitle: 'Tracking',
    description:
      'Understand the purpose and how to use OneClick Tracking to maximize your conversion tracking across multiple platforms.',
    tutorialLabel: 'Watch Tutorial',
    articleLabel: 'Read Article',
    iconName: 'AdsClick',
    iconSymbol: 'material-symbols:ads-click',
  },
};

/**
 * Example of another context (Finance Dashboard)
 * to demonstrate component reusability.
 */
export const FinanceDashboardContext: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Finance',
    description:
      'Track your earnings and dividends in real time with advanced charts.',
    tutorialLabel: 'View Demo',
    articleLabel: 'Documentation',
    iconName: 'AttachMoney',
    iconSymbol: 'material-symbols:attach-money',
  },
};

/**
 * Responsive behavior test (Scroll)
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
