/**
 * A sender's own domain: which names can be one, and how a provider's
 * verification maps to the status an app shows. Holding a domain (which
 * tenant owns it) is the app's business; this module has no store.
 */

export type DnsRecord = {
  type: 'CNAME' | 'TXT' | 'MX';
  name: string;
  value: string;
  /** Recommended, but the provider verifies the domain without it. */
  optional?: boolean;
  /** MX only. */
  priority?: number;
};

/** What the app stores and shows: `error` is a domain that was verified and stopped being. */
export type SenderDomainStatus = 'pending_dns' | 'active' | 'error';

/** Free webmail domains: nobody but their owner can verify them, so they are refused up front. */
export const WEBMAIL_DOMAINS: ReadonlySet<string> = new Set([
  'aol.com',
  'bol.com.br',
  'globo.com',
  'globomail.com',
  'gmail.com',
  'googlemail.com',
  'gmx.com',
  'hotmail.com',
  'hotmail.com.br',
  'icloud.com',
  'ig.com.br',
  'live.com',
  'mail.com',
  'me.com',
  'msn.com',
  'outlook.com',
  'outlook.com.br',
  'proton.me',
  'protonmail.com',
  'terra.com.br',
  'uol.com.br',
  'yahoo.com',
  'yahoo.com.br',
  'yandex.com',
  'zipmail.com.br',
  'zoho.com',
]);

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const TLD = /^([a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

/** What someone typed (a URL, a host or an address), reduced to a bare host. */
const hostOf = (input: unknown) => {
  const raw = String(input ?? '')
    .trim()
    .toLowerCase();
  return (raw.includes('@') ? (raw.split('@').pop() ?? '') : raw)
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .replace(/^www\./, '');
};

const isWellFormed = (host: string) => {
  const labels = host.split('.');
  return (
    host.length > 0 &&
    host.length <= 253 &&
    labels.length >= 2 &&
    labels.every((label) => {
      return LABEL.test(label);
    }) &&
    TLD.test(labels[labels.length - 1])
  );
};

const isReserved = ({
  host,
  reserved,
}: {
  host: string;
  reserved: string[];
}) => {
  return reserved.some((zone) => {
    const z = zone.toLowerCase();
    return host === z || host.endsWith(`.${z}`);
  });
};

export type ParseSenderDomainResult =
  { domain: string } | { error: 'invalid' | 'webmail' | 'reserved' };

/**
 * The domain someone typed, reduced to what a provider verifies: lower case,
 * no scheme, path, port, trailing dot or leading `www.`. An address is read as
 * its domain. `reserved` refuses your own zones (and their subdomains), so a
 * tenant cannot claim `news.yourapp.com`.
 *
 * @example
 * parseSenderDomain({ input: 'vendas@SolarAlfa.com.br' }); // { domain: 'solaralfa.com.br' }
 * parseSenderDomain({ input: 'gmail.com' });               // { error: 'webmail' }
 */
export const parseSenderDomain = ({
  input,
  reserved = [],
}: {
  input: unknown;
  reserved?: string[];
}): ParseSenderDomainResult => {
  const host = hostOf(input);
  if (!isWellFormed(host)) {
    return { error: 'invalid' };
  }
  if (isReserved({ host, reserved })) {
    return { error: 'reserved' };
  }
  if (WEBMAIL_DOMAINS.has(host)) {
    return { error: 'webmail' };
  }
  return { domain: host };
};

/** What a provider says about a domain identity. */
export type DomainVerification =
  'verified' | 'pending' | 'failed' | 'not_found';

/**
 * The status to store after asking the provider. A domain that was active and
 * no longer verifies becomes `error`, not `pending_dns`, so a regression reads
 * differently from a setup in progress.
 */
export const nextDomainStatus = ({
  previous,
  verification,
}: {
  previous: SenderDomainStatus | null | undefined;
  verification: DomainVerification;
}): SenderDomainStatus => {
  if (verification === 'verified') {
    return 'active';
  }
  return previous === 'active' || previous === 'error'
    ? 'error'
    : 'pending_dns';
};
