import {
  render as rtlRender,
  type RenderOptions,
} from '@testing-library/react';
import { I18nProvider } from '@ttoss/react-i18n';
import type * as React from 'react';

const I18nWrapper = ({ children }: { children: React.ReactNode }) => {
  return <I18nProvider locale="en">{children}</I18nProvider>;
};

/**
 * `render` from Testing Library inside an `I18nProvider`, for components that
 * read translated messages (e.g. `GeoVisHoverTooltip`).
 */
export const render = (ui: React.ReactElement, options?: RenderOptions) => {
  return rtlRender(ui, { wrapper: I18nWrapper, ...options });
};
