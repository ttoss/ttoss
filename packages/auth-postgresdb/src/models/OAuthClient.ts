import { Column, DataType, Model, PrimaryKey, Table } from '@ttoss/postgresdb';

/**
 * A registered OAuth client (RFC 7591 dynamic client registration).
 *
 * The RFC's registered fields get their own columns so they can be queried and
 * indexed; any additional metadata a client submits is kept verbatim in
 * `metadata`, because `OAuthClientMetadata` is an open shape.
 */
@Table({
  tableName: 'oauth_clients',
  modelName: 'oauthClient',
})
export class OAuthClient extends Model {
  /** The `client_id` issued by the authorization server. */
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare clientId: string;

  /**
   * Client secret for confidential clients, `null` for public clients
   * (`token_endpoint_auth_method: 'none'`).
   */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare clientSecret: string | null;

  /** Human-readable client name shown on consent screens. */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare clientName: string | null;

  /** Exact redirect URIs registered for this client. */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare redirectUris: string[];

  /** OAuth grant types the client may use. */
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare grantTypes: string[] | null;

  /** OAuth response types the client may use. */
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare responseTypes: string[] | null;

  /** Client authentication method at the token endpoint. */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare tokenEndpointAuthMethod: string | null;

  /** Space-separated scopes the client may request. */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare scope: string | null;

  /** Unix timestamp (seconds) when the client was registered. */
  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare clientIdIssuedAt: number | null;

  /**
   * Registration metadata outside the columns above, preserved so a client's
   * submitted document round-trips unchanged (e.g. `logo_uri`, `client_uri`).
   */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  declare metadata: Record<string, unknown>;
}
