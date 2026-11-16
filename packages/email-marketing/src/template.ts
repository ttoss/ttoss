import { escapeHtml } from './unsubscribe';

/** Values for `{{name}}` placeholders, per recipient. */
export type TemplateVariables = Record<
  string,
  string | number | null | undefined
>;

const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

/**
 * Replaces `{{name}}` placeholders. In `html` mode values are HTML-escaped, so
 * a recipient's name can never inject markup; a missing value becomes `''`.
 *
 * @example
 * renderTemplate({ template: 'Olá, {{ nome }}!', variables: { nome: 'Ana' } }); // 'Olá, Ana!'
 */
export const renderTemplate = ({
  template,
  variables = {},
  html = false,
}: {
  template: string;
  variables?: TemplateVariables;
  html?: boolean;
}): string => {
  return template.replace(PLACEHOLDER, (_match, name: string) => {
    const value = variables[name];
    const text = value === null || value === undefined ? '' : String(value);
    return html ? escapeHtml(text) : text;
  });
};

/** The names a template uses, to check a campaign's variables before sending. */
export const templateVariables = (template: string): string[] => {
  return [
    ...new Set(
      [...template.matchAll(PLACEHOLDER)].map((match) => {
        return match[1];
      })
    ),
  ];
};
