import { Column, DataType, Model, PrimaryKey, Table } from '@ttoss/postgresdb';

/**
 * A single-use consent handoff, correlated by the PKCE `code_challenge`.
 *
 * This is the record an external consent screen writes on approval so the
 * restarted `/authorize` request can be approved without asking again — it is
 * not a durable "user X trusts client Y" grant, which is an app-level
 * authorization decision and belongs in the app's own schema.
 */
@Table({
  tableName: 'oauth_consents',
  modelName: 'oauthConsent',
  indexes: [{ fields: ['expires_at'] }],
})
export class OAuthConsent extends Model {
  /** The PKCE `code_challenge` the consent was recorded against. */
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare codeChallenge: string;

  /** The authenticated end-user subject identifier. */
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare subject: string;

  /** The scopes the user approved. */
  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare scopes: string[];

  /** Instant after which the consent is no longer usable. */
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;
}
