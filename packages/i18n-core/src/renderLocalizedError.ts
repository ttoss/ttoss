import type { I18n, RenderMode } from './createI18n';
import { isLocalizedError } from './LocalizedError';

/**
 * What a boundary sends for a localized error: the stable `code` for machines
 * and the message rendered in the reader's locale. `undefined` for any other
 * value, so a boundary renders only what opted in and leaves every other
 * error — faults included — exactly as it was.
 */
export const renderLocalizedError = ({
  error,
  i18n,
  mode = 'text',
}: {
  error: unknown;
  i18n: Pick<I18n, 'render' | 'renderHtml'>;
  mode?: RenderMode;
}): { code: string; message: string } | undefined => {
  if (!isLocalizedError(error)) {
    return undefined;
  }

  return {
    code: error.code,
    message:
      mode === 'html'
        ? i18n.renderHtml(error.messageRef)
        : i18n.render(error.messageRef),
  };
};
