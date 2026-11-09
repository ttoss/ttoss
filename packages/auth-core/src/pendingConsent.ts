import { randomBytes } from 'node:crypto';

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
  approval?: {
    /** The authenticated end-user subject who approved. */
    subject: string;
    /** The scopes the user granted, a subset of `scopes`. */
    scopes: string[];
  };
};

/**
 * App-provided persistence for {@link PendingAuthorization} records, keyed by
 * `id`. Records are short-lived and single-use; the core deletes each one as
 * its approval is consumed.
 */
export type PendingAuthorizationStore = {
  /** Insert or replace a record by `id`. */
  save: (pending: PendingAuthorization) => Promise<void> | void;
  /** Look up a record by `id`. Return `undefined` if unknown. */
  get: (
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
 * 3. The resumed `/authorize` carries the id. When the stored request is
 *    approved, unexpired and identical to the incoming one, it is consumed
 *    (single use) and approved; otherwise a fresh consent round starts.
 *
 * Unlike {@link createRedirectConsentOnAuthorize}, nothing the consent screen
 * shows comes from its URL, and an approval is bound to the client,
 * `redirect_uri`, scopes and PKCE challenge the user saw.
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

    if (consentId) {
      const pending = await store.get(consentId);
      if (
        isLive(pending) &&
        pending.approval &&
        matchesRequest({ pending, request, resource })
      ) {
        await store.delete(consentId);
        return {
          approved: true,
          subject: pending.approval.subject,
          scopes: pending.approval.scopes,
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

/**
 * Records the signed-in user's approval of a pending authorization and returns
 * the `/authorize` URL the consent screen navigates to, rebuilt from the
 * stored request. Returns `undefined` when the id is unknown, expired or
 * already approved, or when `scopes` asks for more than was requested.
 */
export const approveConsentRequest = async ({
  store,
  id,
  subject,
  scopes,
  authorizeUrl,
}: {
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
  /** The authorization server's `/authorize` endpoint URL. */
  authorizeUrl: string;
}): Promise<{ redirect: string } | undefined> => {
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

  await store.save({ ...pending, approval: { subject, scopes: granted } });

  const url = new URL(authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', pending.clientId);
  url.searchParams.set('redirect_uri', pending.redirectUri);
  url.searchParams.set('code_challenge', pending.codeChallenge);
  url.searchParams.set('code_challenge_method', pending.codeChallengeMethod);
  url.searchParams.set('scope', pending.scopes.join(' '));
  if (pending.state !== undefined) {
    url.searchParams.set('state', pending.state);
  }
  if (pending.resource !== undefined) {
    url.searchParams.set('resource', pending.resource);
  }
  url.searchParams.set(CONSENT_REQUEST_PARAM, pending.id);

  return { redirect: url.toString() };
};

/**
 * Discards a pending authorization the user declined. The consent screen then
 * renders its own "nothing was connected" state; it never navigates to the
 * client's `redirect_uri`.
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
  await store.delete(id);
};
