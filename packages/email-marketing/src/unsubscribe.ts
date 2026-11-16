import { createHmac, timingSafeEqual } from 'node:crypto';

const sign = (payload: string, secret: string) => {
  return createHmac('sha256', secret).update(payload).digest('base64url');
};

/**
 * The token in an unsubscribe link: which sender (`scope`, e.g. a company id)
 * the recipient leaves and which address, signed with HMAC-SHA256 so nobody
 * can unsubscribe someone else by editing the link. It never expires: an
 * opt-out must keep working from an old e-mail.
 *
 * Format: `<scope>.<base64url(email)>.<base64url(signature)>`. `scope` must
 * not contain a dot.
 */
export const createUnsubscribeToken = ({
  scope,
  email,
  secret,
}: {
  scope: string;
  email: string;
  secret: string;
}): string => {
  if (!secret) {
    throw new Error('An unsubscribe secret is required');
  }
  if (!scope || scope.includes('.')) {
    throw new Error('The unsubscribe scope must be non-empty and have no dot');
  }
  const payload = `${scope}.${Buffer.from(email).toString('base64url')}`;
  return `${payload}.${sign(payload, secret)}`;
};

/** The scope and address a token names, or `null` when it was not signed with `secret`. */
export const readUnsubscribeToken = ({
  token,
  secret,
}: {
  token: unknown;
  secret: string;
}): { scope: string; email: string } | null => {
  if (!secret || typeof token !== 'string') {
    return null;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const [scope, encodedEmail, signature] = parts;
  const expected = Buffer.from(sign(`${scope}.${encodedEmail}`, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  const email = Buffer.from(encodedEmail, 'base64url').toString('utf8');
  return scope && email.includes('@') ? { scope, email } : null;
};

export type MessageHeader = { name: string; value: string };

/**
 * The headers that give mail clients a one-click unsubscribe button (RFC 8058),
 * which Gmail and Yahoo require of bulk senders. The URL must accept a `POST`
 * with body `List-Unsubscribe=One-Click`.
 */
export const unsubscribeHeaders = (url: string): MessageHeader[] => {
  return [
    { name: 'List-Unsubscribe', value: `<${url}>` },
    { name: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
  ];
};

export const escapeHtml = (value: string): string => {
  return value.replace(/[&<>"']/g, (char) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[char] as string;
  });
};

export type FooterRenderer = (args: { senderName: string; url: string }) => {
  html: string;
  text: string;
};

/** The default footer, in English. Pass `footer` to the engine for another language. */
export const defaultFooter: FooterRenderer = ({ senderName, url }) => {
  return {
    html: `<p style="font-size:12px;color:#666">You received this e-mail from ${escapeHtml(
      senderName
    )}. <a href="${escapeHtml(url)}">Unsubscribe</a></p>`,
    text: `You received this e-mail from ${senderName}. Unsubscribe: ${url}`,
  };
};
