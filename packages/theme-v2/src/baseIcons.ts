import type { IconGlyphMap } from './Types';

/**
 * Default icon glyph mapping — Fluent UI icons via Iconify.
 *
 * Provides a glyph for every canonical intent defined in `IconIntent`.
 * Used as the foundation for all themes that do not supply their own mapping.
 *
 * Themes may override individual intents via `createTheme({ icons: { ... } })`.
 */
export const baseIcons: IconGlyphMap = {
  // action
  'action.add': 'fluent:add-24-regular',
  'action.edit': 'fluent:edit-24-regular',
  'action.copy': 'fluent:copy-24-regular',
  'action.paste': 'fluent:clipboard-paste-24-regular',
  'action.search': 'fluent:search-24-regular',
  'action.download': 'fluent:arrow-download-24-regular',
  'action.upload': 'fluent:arrow-upload-24-regular',
  'action.share': 'fluent:share-24-regular',
  'action.refresh': 'fluent:arrow-clockwise-24-regular',
  'action.close': 'fluent:dismiss-24-regular',
  'action.clear': 'fluent:eraser-24-regular',
  'action.delete': 'fluent:delete-24-regular',

  // navigation
  'navigation.back': 'fluent:arrow-left-24-regular',
  'navigation.forward': 'fluent:arrow-right-24-regular',
  'navigation.external': 'fluent:open-24-regular',

  // disclosure
  'disclosure.expand': 'fluent:chevron-down-24-regular',
  'disclosure.collapse': 'fluent:chevron-up-24-regular',

  // visibility
  'visibility.show': 'fluent:eye-24-regular',
  'visibility.hide': 'fluent:eye-off-24-regular',

  // selection
  'selection.checked': 'fluent:checkmark-square-24-regular',
  'selection.unchecked': 'fluent:square-24-regular',
  'selection.indeterminate': 'fluent:square-hint-24-regular',

  // status
  'status.success': 'fluent:checkmark-circle-24-regular',
  'status.warning': 'fluent:warning-24-regular',
  'status.error': 'fluent:error-circle-24-regular',
  'status.info': 'fluent:info-24-regular',

  // object
  'object.user': 'fluent:person-24-regular',
  'object.calendar': 'fluent:calendar-24-regular',
  'object.attachment': 'fluent:attach-24-regular',
  'object.settings': 'fluent:settings-24-regular',
};
