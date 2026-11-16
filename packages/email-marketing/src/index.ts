export {
  encodeDisplayName,
  formatAddress,
  isValidEmail,
  normalizeEmail,
} from './address';
export {
  type DnsRecord,
  type DomainVerification,
  nextDomainStatus,
  parseSenderDomain,
  type ParseSenderDomainResult,
  type SenderDomainStatus,
  WEBMAIL_DOMAINS,
} from './domain';
export {
  createEmailMarketing,
  type EmailKind,
  type EmailMarketing,
  type EmailMarketingOptions,
  KIND_TAG,
  SCOPE_TAG,
  type Sender,
  type SendInput,
  type SendResult,
  type SendSkipReason,
} from './engine';
export type {
  DeliveryEvent,
  DomainIdentity,
  EmailProvider,
  OutgoingEmail,
  WebhookResult,
} from './provider';
export {
  createSuppressionList,
  ResubscribeRefusedError,
  strongerReason,
  type Suppression,
  type SuppressionList,
  type SuppressionListOptions,
  type SuppressionReason,
  type SuppressionStore,
} from './suppression';
export {
  createUnsubscribeToken,
  defaultFooter,
  escapeHtml,
  type FooterRenderer,
  type MessageHeader,
  readUnsubscribeToken,
  unsubscribeHeaders,
} from './unsubscribe';
