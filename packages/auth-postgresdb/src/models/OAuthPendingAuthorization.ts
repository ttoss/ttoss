import { Column, DataType, Model, PrimaryKey, Table } from '@ttoss/postgresdb';

/**
 * An `/authorize` request held while the user decides on an external consent
 * screen, for `createPendingConsentOnAuthorize`. The screen reads it by `id`,
 * never from its own URL. The approval columns are set once, on approval; the
 * resumed `/authorize` consumes (deletes) the row.
 */
@Table({
  tableName: 'oauth_pending_authorizations',
  modelName: 'oauthPendingAuthorization',
  indexes: [{ fields: ['expires_at'] }],
})
export class OAuthPendingAuthorization extends Model {
  /** Opaque, unguessable id handed to the consent screen. */
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare id: string;

  /** The requesting `client_id`. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare clientId: string;

  /** The `redirect_uri`, already checked against the client's registration. */
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare redirectUri: string;

  /** The requested scopes. */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare scopes: string[];

  /** The client's `state`. */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare state: string | null;

  /** The PKCE `code_challenge`. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare codeChallenge: string;

  /** The PKCE challenge method. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare codeChallengeMethod: string;

  /** The RFC 8707 `resource`, when the client sent one. */
  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare resource: string | null;

  /** Instant after which the request is no longer usable. */
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  /** The subject who approved; `null` until approval. */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare approvedSubject: string | null;

  /** The scopes the user granted; `null` until approval. */
  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare approvedScopes: string[] | null;

  /** SHA-256 (hex) of the approver's one-time resume secret. */
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare resumeSecretHash: string | null;
}
