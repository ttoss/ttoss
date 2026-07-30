import type {
  ClientStore,
  OAuthClient as OAuthClientRecord,
} from '@ttoss/auth-core';

import type { OAuthClient } from '../models/OAuthClient';

/**
 * Registration fields that have their own column. Everything else a client
 * submits goes to `metadata`, so the document round-trips unchanged.
 */
const COLUMN_FIELDS = [
  'client_id',
  'client_secret',
  'client_name',
  'redirect_uris',
  'grant_types',
  'response_types',
  'token_endpoint_auth_method',
  'scope',
  'client_id_issued_at',
] as const;

const toRecord = (row: OAuthClient): OAuthClientRecord => {
  return {
    ...row.metadata,
    client_id: row.clientId,
    redirect_uris: row.redirectUris,
    ...(row.clientSecret !== null && { client_secret: row.clientSecret }),
    ...(row.clientName !== null && { client_name: row.clientName }),
    ...(row.grantTypes !== null && { grant_types: row.grantTypes }),
    ...(row.responseTypes !== null && { response_types: row.responseTypes }),
    ...(row.tokenEndpointAuthMethod !== null && {
      token_endpoint_auth_method: row.tokenEndpointAuthMethod,
    }),
    ...(row.scope !== null && { scope: row.scope }),
    ...(row.clientIdIssuedAt !== null && {
      client_id_issued_at: Number(row.clientIdIssuedAt),
    }),
  };
};

const toMetadata = (client: OAuthClientRecord): Record<string, unknown> => {
  const metadata: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(client)) {
    if (!(COLUMN_FIELDS as readonly string[]).includes(key)) {
      metadata[key] = value;
    }
  }

  return metadata;
};

/**
 * Creates a {@link ClientStore} backed by the `oauth_clients` table.
 *
 * `register` upserts, so re-registering an existing `client_id` replaces the
 * stored document rather than failing on the primary key.
 */
export const createClientStore = ({
  model,
}: {
  /** The `OAuthClient` model class, taken from the app's `db` handle. */
  model: typeof OAuthClient;
}): ClientStore => {
  return {
    get: async (clientId) => {
      const row = await model.findByPk(clientId);

      return row ? toRecord(row) : undefined;
    },

    register: async (client) => {
      await model.upsert({
        clientId: client.client_id,
        clientSecret: client.client_secret ?? null,
        clientName: client.client_name ?? null,
        redirectUris: client.redirect_uris,
        grantTypes: client.grant_types ?? null,
        responseTypes: client.response_types ?? null,
        tokenEndpointAuthMethod: client.token_endpoint_auth_method ?? null,
        scope: client.scope ?? null,
        clientIdIssuedAt: client.client_id_issued_at ?? null,
        metadata: toMetadata(client),
      });
    },
  };
};
