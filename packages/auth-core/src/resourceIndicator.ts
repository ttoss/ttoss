/**
 * RFC 8707 resource-indicator checks for the OAuth authorization server.
 */

/** Compares resource identifiers, ignoring a trailing slash. */
const normalizeResource = (value: string): string => {
  return value.replace(/\/$/, '');
};

/**
 * Checks the RFC 8707 `resource` parameter against the configured resource.
 * Returns `true` when the parameter is absent, when no resource is configured
 * (the parameter is then ignored), or when every value names the configured
 * resource — a repeated parameter arrives as an array.
 */
export const isAllowedResource = ({
  requested,
  configured,
}: {
  requested: unknown;
  configured: string | undefined;
}): boolean => {
  if (requested === undefined || configured === undefined) {
    return true;
  }
  const values = Array.isArray(requested) ? requested : [requested];
  return values.every((value) => {
    return (
      typeof value === 'string' &&
      normalizeResource(value) === normalizeResource(configured)
    );
  });
};

export const INVALID_TARGET_DESCRIPTION =
  'resource is not served by this authorization server';
