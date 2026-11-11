import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { asString } from './authenticateClient';
import type {
  ClientStore,
  OAuthClient,
  OnAuthorizeArgs,
  OnAuthorizeResult,
} from './oauthServerTypes';
import {
  type ClientDisplay,
  resolveClientDisplay,
} from './redirectConsentOnAuthorize';

/**
 * Query-string parameter that carries a pending authorization's id: on the
 * consent URL, and on the `/authorize` request the consent page resumes.
 */
export const CONSENT_REQUEST_PARAM = 'consent_request';

/**
 * Query-string parameter that carries the one-time secret
 * {@link approveConsentRequest} hands to the approver, on the `/authorize`
 * request that resumes the approval. Only a request carrying it redeems the
 * approval.
 */
export const CONSENT_RESUME_PARAM = 'consent_resume';

/**
 * An authorization request `/authorize` already validated (known client,
 * registered `redirect_uri`, PKCE), held server-side while the user decides.
 * The consent screen reads it by `id`, never from its own URL, so what the user
 * sees is exactly what an approval authorizes.
 */
export type PendingAuthorization = {
  /** Opaque, unguessable identifier handed to the consent screen. */
  id: string;
  /** The requesting `client_id`. */
  clientId: string;
  /** The `redirect_uri`, already checked against the client's registration. */
  redirectUri: string;
  /** The requested scopes. */
  scopes: string[];
  /** The client's `state`, echoed on the resumed `/authorize`. */
  state?: string;
  /** The PKCE `code_challenge`. */
  codeChallenge: string;
  /** The PKCE challenge method (always `'S256'`). */
  codeChallengeMethod: string;
  /** The RFC 8707 `resource` the client asked for, when it sent one. */
  resource?: string;
  /** Unix timestamp (milliseconds) after which the request is invalid. */
  expiresAt: number;
  /** Set once by {@link approveConsentRequest}; absent until the user approves. */
  approval?: PendingApproval;
};

/** The user's approval of a {@link PendingAuthorization}. */
export type PendingApproval = {
  /** The authenticated end-user subject who approved. */
  subject: string;
  /** The scopes the user granted, a subset of the requested ones. */
  scopes: string[];
  /**
   * SHA-256 (hex) of the one-time secret handed to the approver. The resumed
   * `/authorize` must present the secret, so an approval is redeemable only by
   * the browser that approved, never by whoever else holds the request id.
   */
  resumeSecretHash: string;
};

/**
 * App-provided persistence for {@link PendingAuthorization} records, keyed by
 * `id`. Records are short-lived and single-use. `approve` and `consume` must be
 * atomic (a conditional `UPDATE … RETURNING`, a `DELETE … RETURNING`), so two
 * concurrent calls can never both succeed.
 */
export type PendingAuthorizationStore = {
  /** Insert a new, unapproved record. */
  save: (pending: PendingAuthorization) => Promise<void> | void;
  /** Look up a record by `id`. Return `undefined` if unknown. */
  get: (
    id: string
  ) =>
    | Promise<PendingAuthorization | undefined>
    | PendingAuthorization
    | undefined;
  /**
   * Record `approval` on the record `id` only if it exists and has no approval
   * yet. Return whether it was recorded.
   */
  approve: (params: {
    id: string;
    approval: PendingApproval;
  }) => Promise<boolean> | boolean;
  /**
   * Remove the record `id` and return it, or `undefined` if it was already
   * gone. Only one of any concurrent calls gets the record.
   */
  consume: (
    id: string
  ) =>
    | Promise<PendingAuthorization | undefined>
    | PendingAuthorization
    | undefined;
  /** Remove a record by `id`. */
  delete: (id: string) => Promise<void> | void;
};

/** Default lifetime of a pending authorization: ten minutes. */
const DEFAULT_TTL_SECONDS = 600;

const generateId = (): string => {
  return randomBytes(32).toString('base64url');
};

const hashSecret = (secret: string): string => {
  return createHash('sha256').update(secret).digest('hex');
};

const secretMatches = ({
  secret,
  hash,
}: {
  secret: string;
  hash: string;
}): boolean => {
  const presented = Buffer.from(hashSecret(secret), 'hex');
  const expected = Buffer.from(hash, 'hex');
  return (
    presented.length === expected.length && timingSafeEqual(presented, expected)
  );
};

const sameScopes = (a: string[], b: string[]): boolean => {
  return (
    a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ')
  );
};

const isLive = (
  pending: PendingAuthorization | undefined
): pending is PendingAuthorization => {
  return pending !== undefined && pending.expiresAt > Date.now();
};

/**
 * Whether the resumed `/authorize` is the very request the user approved.
 * Every parameter that decides where the code goes or what it grants must
 * match, so an approval can never be redeemed by a different client, redirect
 * or PKCE challenge.
 */
const matchesRequest = ({
  pending,
  request,
  resource,
}: {
  pending: PendingAuthorization;
  request: OnAuthorizeArgs['request'];
  resource: string | undefined;
}): boolean => {
  return (
    pending.clientId === request.clientId &&
    pending.redirectUri === request.redirectUri &&
    pending.codeChallenge === request.codeChallenge &&
    pending.codeChallengeMethod === request.codeChallengeMethod &&
    pending.state === request.state &&
    pending.resource === resource &&
    sameScopes(pending.scopes, request.scopes)
  );
};

/**
 * The approval a resumed `/authorize` redeems, or `undefined`. The secret is
 * checked before the record is consumed, so a caller without it cannot burn
 * the approver's approval; the consume is atomic, so it is redeemed once.
 */
const redeemApproval = async ({
  store,
  consentId,
  resumeSecret,
  request,
  resource,
}: {
  store: PendingAuthorizationStore;
  consentId: string;
  resumeSecret: string;
  request: OnAuthorizeArgs['request'];
  resource: string | undefined;
}): Promise<PendingApproval | undefined> => {
  const pending = await store.get(consentId);
  if (
    !isLive(pending) ||
    !pending.approval ||
    !secretMatches({
      secret: resumeSecret,
      hash: pending.approval.resumeSecretHash,
    }) ||
    !matchesRequest({ pending, request, resource })
  ) {
    return undefined;
  }

  const consumed = await store.consume(consentId);
  return consumed?.approval;
};

/**
 * Options for {@link createPendingConsentOnAuthorize}.
 */
export type CreatePendingConsentOnAuthorizeOptions = {
  /**
   * Base URL of the consent screen. Only {@link CONSENT_REQUEST_PARAM} is
   * appended; the screen loads everything else with {@link getConsentRequest}.
   */
  consentUrl: string;
  /** Persistence for pending authorizations. */
  store: PendingAuthorizationStore;
  /**
   * Lifetime of a pending authorization, in seconds.
   * @default 600
   */
  ttlSeconds?: number;
};

/**
 * Factory for the `onAuthorize` hook of an OAuth server whose consent screen
 * lives outside it, holding the authorization request server-side.
 *
 * Flow:
 * 1. `/authorize` (client and `redirect_uri` already validated) stores a
 *    {@link PendingAuthorization} and redirects to `consentUrl` with only its
 *    opaque id.
 * 2. The consent screen loads the request with {@link getConsentRequest} and,
 *    on approval, calls {@link approveConsentRequest}, which records the
 *    subject and returns the `/authorize` URL to resume.
 * 3. The resumed `/authorize` carries the id and the one-time resume secret
 *    the approver received. When the stored request is approved, unexpired,
 *    identical to the incoming one and the secret matches, it is consumed
 *    (atomically, single use) and approved; otherwise a fresh consent round
 *    starts.
 *
 * Unlike {@link createRedirectConsentOnAuthorize}, nothing the consent screen
 * shows comes from its URL, and an approval is bound to the client,
 * `redirect_uri`, scopes and PKCE challenge the user saw, and redeemable only
 * by the browser that approved.
 */
export const createPendingConsentOnAuthorize = ({
  consentUrl,
  store,
  ttlSeconds = DEFAULT_TTL_SECONDS,
}: CreatePendingConsentOnAuthorizeOptions) => {
  return async ({
    request,
    query,
  }: OnAuthorizeArgs): Promise<OnAuthorizeResult> => {
    const resource = asString(query?.resource);
    const consentId = asString(query?.[CONSENT_REQUEST_PARAM]);
    const resumeSecret = asString(query?.[CONSENT_RESUME_PARAM]);

    if (consentId && resumeSecret) {
      const approval = await redeemApproval({
        store,
        consentId,
        resumeSecret,
        request,
        resource,
      });
      if (approval) {
        return {
          approved: true,
          subject: approval.subject,
          scopes: approval.scopes,
        };
      }
    }

    const pending: PendingAuthorization = {
      id: generateId(),
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      scopes: request.scopes,
      state: request.state,
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: request.codeChallengeMethod,
      resource,
      expiresAt: Date.now() + ttlSeconds * 1000,
    };
    await store.save(pending);

    const url = new URL(consentUrl);
    url.searchParams.set(CONSENT_REQUEST_PARAM, pending.id);
    return { approved: false, redirect: url.toString() };
  };
};

/**
 * What a consent screen shows, read from the server-held request and the
 * registered client, never from the screen's own URL.
 */
export type ConsentRequestView = {
  /** The pending authorization's id. */
  id: string;
  /** The requesting `client_id`. */
  clientId: string;
  /**
   * Display name from the client's registration (or the fallback). Dynamic
   * client registration lets anyone choose it: show it as a claim, and show
   * `redirectUri` as the fact.
   */
  clientName?: string;
  /** Logo from the client's registration (or the fallback); self-reported. */
  logoUri?: string;
  /** Where the authorization code will be sent if the user approves. */
  redirectUri: string;
  /** The requested scopes. */
  scopes: string[];
  /** Unix timestamp (milliseconds) after which the request is invalid. */
  expiresAt: number;
};

/**
 * Loads a pending authorization for the consent screen. Returns `undefined`
 * when the id is unknown, expired or already approved, so a link can be
 * neither reused nor re-approved by someone else.
 */
export const getConsentRequest = async ({
  store,
  id,
  clientStore,
  getClientDisplayFallback,
}: {
  /** Persistence for pending authorizations. */
  store: PendingAuthorizationStore;
  /** The id from the consent URL's {@link CONSENT_REQUEST_PARAM}. */
  id: string;
  /** Source of the registered client's `client_name` and `logo_uri`. */
  clientStore?: ClientStore;
  /** Fills display fields the registered client omits. */
  getClientDisplayFallback?: (params: {
    clientId: string;
    client?: OAuthClient;
  }) => ClientDisplay | undefined;
}): Promise<ConsentRequestView | undefined> => {
  const pending = await store.get(id);
  if (!isLive(pending) || pending.approval) {
    return undefined;
  }

  const { clientName, logoUri } = await resolveClientDisplay(
    pending.clientId,
    clientStore,
    getClientDisplayFallback
  );

  return {
    id: pending.id,
    clientId: pending.clientId,
    clientName,
    logoUri,
    redirectUri: pending.redirectUri,
    scopes: pending.scopes,
    expiresAt: pending.expiresAt,
  };
};

/** Arguments of {@link approveConsentRequest}. */
export type ApproveConsentRequestArgs = {
  /** Persistence for pending authorizations. */
  store: PendingAuthorizationStore;
  /** The pending authorization's id. */
  id: string;
  /** The authenticated end-user subject approving it. */
  subject: string;
  /**
   * The scopes the user grants, a subset of the requested ones.
   * @default the requested scopes
   */
  scopes?: string[];
  /**
   * The authorization server's `/authorize` endpoint URL. When given, the
   * result also carries `redirect`, the full URL to navigate to; omit it when
   * the caller (an API that does not know the server's URL) builds the URL
   * from `resumeParams` itself.
   */
  authorizeUrl?: string;
};

/** What {@link approveConsentRequest} returns for a recorded approval. */
export type ApprovedConsentRequest = {
  /**
   * The resumed `/authorize` request as query parameters, carrying the
   * one-time resume secret.
   */
  resumeParams: Record<string, string>;
};

/**
 * Records the signed-in user's approval of a pending authorization and returns
 * the `/authorize` request that resumes it, rebuilt from the stored request
 * and carrying a one-time resume secret: as `resumeParams`, plus the full
 * `redirect` URL when `authorizeUrl` is given. Hand it only to the approver:
 * whoever holds it redeems the approval. Returns `undefined` when the id is
 * unknown, expired or already approved, or when `scopes` asks for more than
 * was requested.
 */
export function approveConsentRequest(
  args: ApproveConsentRequestArgs & { authorizeUrl: string }
): Promise<(ApprovedConsentRequest & { redirect: string }) | undefined>;
export function approveConsentRequest(
  args: ApproveConsentRequestArgs & { authorizeUrl?: undefined }
): Promise<ApprovedConsentRequest | undefined>;
export async function approveConsentRequest({
  store,
  id,
  subject,
  scopes,
  authorizeUrl,
}: ApproveConsentRequestArgs): Promise<
  (ApprovedConsentRequest & { redirect?: string }) | undefined
> {
  const pending = await store.get(id);
  if (!isLive(pending) || pending.approval) {
    return undefined;
  }

  const granted = scopes ?? pending.scopes;
  if (
    !granted.every((scope) => {
      return pending.scopes.includes(scope);
    })
  ) {
    return undefined;
  }

  const resumeSecret = generateId();
  const recorded = await store.approve({
    id,
    approval: {
      subject,
      scopes: granted,
      resumeSecretHash: hashSecret(resumeSecret),
    },
  });
  if (!recorded) {
    return undefined;
  }

  const params = new URLSearchParams();
  params.set('response_type', 'code');
  params.set('client_id', pending.clientId);
  params.set('redirect_uri', pending.redirectUri);
  params.set('code_challenge', pending.codeChallenge);
  params.set('code_challenge_method', pending.codeChallengeMethod);
  params.set('scope', pending.scopes.join(' '));
  if (pending.state !== undefined) {
    params.set('state', pending.state);
  }
  if (pending.resource !== undefined) {
    params.set('resource', pending.resource);
  }
  params.set(CONSENT_REQUEST_PARAM, pending.id);
  params.set(CONSENT_RESUME_PARAM, resumeSecret);

  const resumeParams = Object.fromEntries(params);

  if (authorizeUrl === undefined) {
    return { resumeParams };
  }

  const url = new URL(authorizeUrl);
  for (const [key, value] of params) {
    url.searchParams.set(key, value);
  }
  return { redirect: url.toString(), resumeParams };
}

/**
 * Discards a pending authorization the user declined. An approved request is
 * left alone, so a stale deny from another tab cannot cancel an approval about
 * to be redeemed. The consent screen then renders its own "nothing was
 * connected" state; it never navigates to the client's `redirect_uri`.
 */
export const denyConsentRequest = async ({
  store,
  id,
}: {
  /** Persistence for pending authorizations. */
  store: PendingAuthorizationStore;
  /** The pending authorization's id. */
  id: string;
}): Promise<void> => {
  const pending = await store.get(id);
  if (pending && !pending.approval) {
    await store.delete(id);
  }
};
