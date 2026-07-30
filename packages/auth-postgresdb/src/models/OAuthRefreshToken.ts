import { Column, DataType, Model, PrimaryKey, Table } from '@ttoss/postgresdb';

/**
 * A refresh token tracked for OAuth 2.1 rotation, stored by hash so a database
 * dump yields no usable credentials.
 *
 * `consumedAt` marks a rotated token. Presenting one again is reuse, and
 * `createRefreshRotation` revokes the whole `(clientId, subject)` token set —
 * which is why the store adapter must report a live token's `consumedAt` as
 * absent rather than as `null`.
 */
@Table({
  tableName: 'oauth_refresh_tokens',
  modelName: 'oauthRefreshToken',
  indexes: [{ fields: ['client_id', 'subject'] }, { fields: ['expires_at'] }],
})
export class OAuthRefreshToken extends Model {
  /** SHA-256 hash (hex) of the opaque refresh token. */
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare tokenHash: string;

  /** The `client_id` the token was issued to. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare clientId: string;

  /** The authenticated end-user subject identifier. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare subject: string;

  /** The scopes granted to this token. */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare scopes: string[];

  /** Instant after which the token is invalid. */
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  /** Instant the token was rotated (consumed), or `null` while it is live. */
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare consumedAt: Date | null;
}
