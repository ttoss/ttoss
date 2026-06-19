import type { OnAuthorizeArgs, OnAuthorizeResult } from './oauthServerTypes';

/**
 * A consent grant stored by `codeChallenge` (PKCE), representing a
 * previously-approved authorization that the `onAuthorize` hook can consume.
 */
export type ConsentGrant = {
  /** The authenticated end-user subject identifier. */
  subject: string;
  /** The scopes the user approved. */
  scopes: string[];
  /** Unix timestamp (milliseconds) after which the grant is invalid. */
  expiresAt: number;
};

/**
 * Persistence contract for consent grants, correlated by PKCE `codeChallenge`.
 * The write side (creating a grant) lives in the application; this interface
 * covers only what the `onAuthorize` hook needs: read and single-use consume.
 */
export type ConsentGrantStore = {
  /** Look up a consent grant by its PKCE `codeChallenge`. */
  getConsentGrant: (params: {
    codeChallenge: string;
  }) => Promise<ConsentGrant | undefined>;
  /** Delete a consent grant (called after consumption to enforce single-use). */
  deleteConsentGrant: (params: { codeChallenge: string }) => Promise<void>;
};

/**
 * Options for {@link createRedirectConsentOnAuthorize}.
 */
export type CreateRedirectConsentOnAuthorizeOptions = {
  /**
   * Base URL of the external consent screen. OAuth parameters are appended as
   * query-string values: `client_id`, `redirect_uri`, `code_challenge`,
   * `code_challenge_method`, `scope`, and `state` (when present).
   */
  consentUrl: string;
} & ConsentGrantStore;

/**
 * Factory that produces the `onAuthorize` hook for an OAuth server with a
 * deferred/external consent screen.
 *
 * Flow:
 * 1. If a valid (non-expired) consent grant exists for `request.codeChallenge`,
 *    it is consumed (deleted, single-use) and `{ approved: true }` is returned.
 * 2. Otherwise the user is redirected to `consentUrl` with the full OAuth
 *    request parameters so the consent screen can record its approval and
 *    restart the authorization flow.
 */
export const createRedirectConsentOnAuthorize = ({
  consentUrl,
  getConsentGrant,
  deleteConsentGrant,
}: CreateRedirectConsentOnAuthorizeOptions) => {
  return async (args: OnAuthorizeArgs): Promise<OnAuthorizeResult> => {
    const { request } = args;
    const {
      codeChallenge,
      codeChallengeMethod,
      clientId,
      redirectUri,
      scopes,
      state,
    } = request;

    const grant = await getConsentGrant({ codeChallenge });

    if (grant && grant.expiresAt > Date.now()) {
      await deleteConsentGrant({ codeChallenge });
      return { approved: true, subject: grant.subject, scopes: grant.scopes };
    }

    const url = new URL(consentUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', codeChallengeMethod);
    url.searchParams.set('scope', scopes.join(' '));
    if (state !== undefined) {
      url.searchParams.set('state', state);
    }

    return { approved: false, redirect: url.toString() };
  };
};
