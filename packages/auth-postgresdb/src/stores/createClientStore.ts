import type {
  ClientStore,
  OAuthClient as OAuthClientRecord,
} from '@ttoss/auth-core';
import { hashClientSecret, verifyClientSecret } from '@ttoss/auth-core';

import type { OAuthClient } from '../models/OAuthClient';

/**
 * Registration fields that have their own column. Everything else a client
 * submits goes to `metadata`, so the document round-trips unchanged.
 *
 * `client_secret` is listed here even though no column holds it verbatim: it
 * must never fall through to the `metadata` JSONB, which would defeat hashing.
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
 * Creates a {@link ClientStore} backed by the `oauth_clients` table, storing
 * client secrets by SHA-256 hash.
 *
 * Because the secret is not recoverable, `get` omits `client_secret` and client
 * authentication goes through `verifyClientSecret`, which compares the
 * presented value against the stored hash. The engine only ever needs that
 * comparison — the registration response echoes the secret from the document it
 * just generated, never from a read — so nothing is lost by not keeping it.
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

    verifyClientSecret: async ({ clientId, clientSecret }) => {
      const row = await model.findByPk(clientId);

      if (!row) {
        return false;
      }

      // A public client has no secret to present.
      if (row.clientSecretHash === null) {
        return true;
      }

      return verifyClientSecret({
        clientSecret,
        clientSecretHash: row.clientSecretHash,
      });
    },

    register: async (client) => {
      await model.upsert({
        clientId: client.client_id,
        clientSecretHash: client.client_secret
          ? hashClientSecret({ clientSecret: client.client_secret })
          : null,
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
