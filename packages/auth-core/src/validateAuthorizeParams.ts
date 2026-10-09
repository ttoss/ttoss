import { asString } from './authenticateClient';
import type { OAuthResponse } from './oauthServerTypes';
import {
  INVALID_TARGET_DESCRIPTION,
  isAllowedResource,
} from './resourceIndicator';

/** Appends the defined `params` to `redirectUri`'s query string. */
export const redirectWithParams = (
  redirectUri: string,
  params: Record<string, string | undefined>
): string => {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
};

/**
 * Validates the authorization request's `response_type`, PKCE, and RFC 8707
 * `resource` parameters, returning a redirect-error response when invalid, or
 * `undefined` when valid.
 */
export const validateAuthorizeParams = ({
  query,
  redirectUri,
  state,
  resource,
}: {
  query: Record<string, string | undefined>;
  redirectUri: string;
  state: string | undefined;
  resource: string | undefined;
}): OAuthResponse | undefined => {
  const redirectError = (error: string, description: string): OAuthResponse => {
    return {
      status: 302,
      redirect: redirectWithParams(redirectUri, {
        error,
        error_description: description,
        state,
      }),
    };
  };

  if (asString(query.response_type) !== 'code') {
    return redirectError(
      'unsupported_response_type',
      'response_type must be code'
    );
  }
  if (!asString(query.code_challenge)) {
    return redirectError(
      'invalid_request',
      'code_challenge is required (PKCE)'
    );
  }
  if ((asString(query.code_challenge_method) ?? 'plain') !== 'S256') {
    return redirectError(
      'invalid_request',
      'code_challenge_method must be S256'
    );
  }
  if (!isAllowedResource({ requested: query.resource, configured: resource })) {
    return redirectError('invalid_target', INVALID_TARGET_DESCRIPTION);
  }
  return undefined;
};
