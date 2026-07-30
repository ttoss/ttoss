import { Column, DataType, Model, PrimaryKey, Table } from '@ttoss/postgresdb';

/**
 * A short-lived authorization code with its bound PKCE challenge.
 *
 * The primary key is the code's SHA-256 hash, never the code itself: a code
 * travels through a browser redirect and a client's URL bar, so storing it in
 * plaintext would make a database dump yield replayable codes.
 */
@Table({
  tableName: 'oauth_auth_codes',
  modelName: 'oauthAuthCode',
  indexes: [{ fields: ['expires_at'] }],
})
export class OAuthAuthCode extends Model {
  /** SHA-256 hash (hex) of the authorization code. */
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare codeHash: string;

  /** The `client_id` the code was issued to. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare clientId: string;

  /** The redirect URI the code was issued for (must match on exchange). */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare redirectUri: string;

  /** The PKCE `code_challenge` (S256) bound to this code. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare codeChallenge: string;

  /** The scopes granted to this code. */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare scopes: string[];

  /** The authenticated end-user subject identifier. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare subject: string;

  /** Instant after which the code is invalid. */
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;
}
