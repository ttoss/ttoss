const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * An address as the engine compares and stores it: trimmed and lower case,
 * so `Maria@Example.com` and `maria@example.com ` are one recipient. Anything
 * that is not a string becomes `''`.
 */
export const normalizeEmail = (value: unknown): string => {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
};

/** Whether the value looks like a deliverable address (`local@domain.tld`). */
export const isValidEmail = (value: unknown): boolean => {
  return EMAIL.test(normalizeEmail(value));
};

export const encodeDisplayName = (name: string): string => {
  return /^[\x20-\x7e]*$/.test(name)
    ? `"${name.replace(/["\\]/g, '\\$&')}"`
    : `=?UTF-8?B?${Buffer.from(name, 'utf8').toString('base64')}?=`;
};

/**
 * A `From`/`Reply-To` header value: `"Name" <address>`. A name with characters
 * outside printable ASCII is written as an RFC 2047 encoded word, which is
 * what SES and most transports require; line breaks are dropped so a name can
 * never inject a header.
 *
 * @example
 * formatAddress({ name: 'Solar Ômega', email: 'contato@omega.com.br' });
 * // '=?UTF-8?B?U29sYXIgw5RtZWdh?= <contato@omega.com.br>'
 */
export const formatAddress = ({
  name,
  email,
}: {
  name?: string | null;
  email: string;
}): string => {
  const clean = (name ?? '').replace(/[\r\n]+/g, ' ').trim();
  if (!clean) {
    return email;
  }
  return `${encodeDisplayName(clean)} <${email}>`;
};
