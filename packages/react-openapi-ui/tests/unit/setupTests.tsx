import { I18nProvider } from '@ttoss/react-i18n';
import { setOptions } from '@ttoss/test-utils/react';
import type * as React from 'react';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <I18nProvider locale="en">{children}</I18nProvider>;
};

setOptions({ wrapper: Providers });

/**
 * jsdom does not implement the modal methods of `<dialog>`; they only toggle
 * the `open` attribute here, which is all the components rely on.
 */
HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};
