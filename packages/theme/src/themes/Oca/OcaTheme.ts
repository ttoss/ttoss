import { Theme } from 'theme-ui';

import { createTheme } from '../../createTheme';
import { BruttalTheme } from '../Bruttal/Bruttal';
import { defaultTheme } from '../default/defaultTheme';
import { ocaSpace } from './OcaSpacing';

type DefaultBorders = {
  none: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
};

const defaultBorders = defaultTheme.borders as DefaultBorders;

export const OcaTheme: Theme = createTheme(
  {
    colors: {
      navigation: {
        background: {
          primary: { default: '#FFFFFF' },
          muted: { default: '#F3F4F6' },
        },
        text: {
          primary: { default: '#111827' },
          secondary: { default: '#465A69' },
          accent: { default: '#03FF7A' },
          muted: { default: '#6B7280' },
        },
        border: {
          primary: { default: '#E5E7EB' },
          muted: { default: '#9CA3AF' },
        },
      },
      input: {
        border: {
          muted: { default: '#E5E7EB' },
          accent: { default: '#03FF7A' },
        },
        background: {
          primary: { default: '#FFFFFF' },
          secondary: { default: '#465A69' },
          accent: { default: '#03FF7A' },
          muted: {
            default: '#F3F4F6',
            active: '#F3F4F6',
            disabled: '#9CA3AF',
          },
          negative: { default: 'red' },
        },
        text: {
          primary: { default: '#111827' },
          accent: { default: '#03FF7A' },
          secondary: { default: '#465A69' },
          muted: {
            default: '#6B7280',
            active: '#6B7280',
          },
          negative: { default: 'red' },
        },
      },
      action: {
        background: {
          primary: {
            default: '#111827',
            active: '#111827',
          },
          secondary: {
            default: '#465A69',
          },
          accent: {
            default: '#03FF7A',
            active: '#03FF7A',
          },
          caution: { default: 'orange' },
          muted: { default: '#F3F4F6' },
          negative: { default: 'red' },
        },
        text: {
          primary: { default: '#FFFFFF' },
          accent: { default: '#000000' },
          secondary: { default: '#FFFFFF' },
          muted: { default: '#6B7280' },
          caution: { default: 'white' },
          negative: { default: 'white' },
        },
      },
      display: {
        background: {
          primary: { default: '#FFFFFF' },
          secondary: { default: '#FFFFFF' },
          muted: { default: '#F3F4F6' },
        },
        text: {
          primary: { default: '#111827' },
          secondary: { default: '#465A69' },
          accent: { default: '#03FF7A' },
          muted: {
            default: '#6B7280',
            active: '#6B7280',
          },
          negative: { default: 'red' },
        },
        border: {
          primary: { default: '#111827' },
          secondary: { default: '#465A69' },
          muted: {
            default: '#E5E7EB',
            active: '#E5E7EB',
          },
          negative: { default: 'red' },
          accent: { default: '#03FF7A' },
        },
      },
      feedback: {
        text: {
          primary: { default: '#FFFFFF' },
          secondary: { default: '#FFFFFF' },
          caution: { default: '#764B00' },
          negative: { default: '#7D0202' },
          positive: { default: '#064002' },
        },
        border: {
          primary: { default: '#eef9fd' },
          secondary: { default: '#465A69' },
          muted: { default: '#E5E7EB' },
          negative: { default: '#ffebec' },
          caution: { default: '#fff8e6', active: '#eead2d' },
          positive: { default: '#e6f6e6' },
        },
        background: {
          primary: { default: '#eef9fd' },
          secondary: { default: '#FFFFFF' },
          muted: { default: '#F3F4F6' },
          negative: { default: '#ffebec' },
          caution: { default: '#fff8e6' },
          positive: { default: '#e6f6e6' },
        },
      },
    },
    fonts: {
      heading: '"Outfit", sans-serif',
      body: '"Source Sans Pro", sans-serif',
      mono: '"Inconsolata", sans-serif',
    },
    borders: {
      none: defaultBorders.none,
      xs: defaultBorders.xs,
      sm: defaultBorders.xs,
      md: defaultBorders.sm,
      lg: defaultBorders.md,
      xl: defaultBorders.lg,
    },
    space: {
      ...defaultTheme.space,
      ...ocaSpace,
    },
    radii: defaultTheme.radii,
    /**
     * Global styles
     */
    styles: {
      root: {
        /**
         * select out of forms
         */
        '.react-select__control': {
          color: 'display.text.secondary.default',
          backgroundColor: 'display.background.primary.default',
          borderColor: 'display.border.muted.default',
          borderRadius: 'lg',
          '&.react-select__control--is-disabled': {
            border: 'md',
            backgroundColor: 'input.background.muted.default',
            borderColor: 'display.border.muted.default',
          },
        },
      },
    },
    /**
     * Components
     */

    buttons: {
      accent: {
        borderRadius: 'full',
      },
      primary: {
        borderRadius: 'full',
      },
      secondary: {
        borderRadius: 'full',
        border: 'none',
      },
      destructive: {
        borderRadius: 'full',
      },
      closeButton: {
        borderRadius: 'lg',
      },
      actionButton: {
        default: {
          border: 'none',
          ':is(:focus-within, :hover)': {
            backgroundColor: 'action.background.primary.default',
          },
        },
      },
    },

    forms: {
      input: {
        borderRadius: 'lg',
      },
      inputNumber: {
        borderRadius: 'lg',
      },
      select: {
        borderRadius: 'lg',
      },
      textarea: {
        borderRadius: 'lg',
      },
    },
  },
  BruttalTheme
);
