import type {
  ClientStore,
  OAuthClient,
  OnAuthorizeArgs,
  OnAuthorizeResult,
} from './oauthServerTypes';

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
 * Human-readable display fields for an OAuth client, safe to show on a consent
 * screen. Used by the fallback resolver when the client record omits them.
 */
export type ClientDisplay = {
  /** Human-readable client name to show on the consent screen. */
  clientName?: string;
  /** URL of the client's logo image. */
  logoUri?: string;
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
  /**
   * Optional client store used to look up the registered client by id so its
   * `client_name` and `logo_uri` can be appended to the consent redirect URL.
   * When omitted, only `getClientDisplayFallback` (if provided) contributes.
   */
  clientStore?: ClientStore;
  /**
   * Optional fallback resolver for display fields when the registered client
   * record omits `client_name` or `logo_uri`. Receives the `clientId` and the
   * resolved client record (if any); return a partial {@link ClientDisplay} to
   * fill the gaps. Consumer-owned — ttoss never hard-codes client display data.
   */
  getClientDisplayFallback?: (params: {
    clientId: string;
    client?: OAuthClient;
  }) => ClientDisplay | undefined;
} & ConsentGrantStore;

const resolveClientDisplay = async (
  clientId: string,
  clientStore: ClientStore | undefined,
  getClientDisplayFallback:
    | ((params: {
        clientId: string;
        client?: OAuthClient;
      }) => ClientDisplay | undefined)
    | undefined
): Promise<ClientDisplay> => {
  const client = clientStore ? await clientStore.get(clientId) : undefined;
  const fallback = getClientDisplayFallback?.({ clientId, client });
  const clientName = client?.client_name ?? fallback?.clientName;
  const logoUri =
    typeof client?.logo_uri === 'string' && client.logo_uri
      ? client.logo_uri
      : fallback?.logoUri;
  return { clientName, logoUri };
};

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
  clientStore,
  getClientDisplayFallback,
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

    if (clientStore !== undefined || getClientDisplayFallback !== undefined) {
      const { clientName, logoUri } = await resolveClientDisplay(
        clientId,
        clientStore,
        getClientDisplayFallback
      );
      if (clientName !== undefined) {
        url.searchParams.set('client_name', clientName);
      }
      if (logoUri !== undefined) {
        url.searchParams.set('logo_uri', logoUri);
      }
    }

    return { approved: false, redirect: url.toString() };
  };
};
