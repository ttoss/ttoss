import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { defineMessages, fmt, msg } from '@ttoss/i18n-core';
import { LocalizedText } from '@ttoss/react-i18n';

const messages = defineMessages({
  spent: {
    defaultMessage: 'Campaign {campaign} spent {amount} on {date}.',
    description: 'Spend summary produced by a backend job',
  },
});

const meta: Meta<typeof LocalizedText> = {
  title: 'React i18n/LocalizedText',
  component: LocalizedText,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders a message reference produced on the backend with `@ttoss/i18n-core` in the current locale, formatting deferred values with the reader conventions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocalizedText>;

/**
 * A reference whose amount and date are formatted at render time.
 */
export const Default: Story = {
  args: {
    value: msg(messages.spent, {
      campaign: 'Black Friday',
      amount: fmt.currency({ value: 1234.5, currency: 'USD' }),
      date: fmt.date({ value: '2026-09-28T12:00:00Z', timeZone: 'UTC' }),
    }),
  },
};

/**
 * A plain string, as rows written before references existed, renders as is.
 */
export const PlainString: Story = {
  args: { value: 'Texto legado' },
};
