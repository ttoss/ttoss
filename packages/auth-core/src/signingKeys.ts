import crypto from 'node:crypto';

/**
 * Asymmetric JWS algorithms `signJwt` / `verifyJwt` support besides HS256.
 *
 * `EdDSA` is Ed25519 (RFC 8037); `ES256` is ECDSA on P-256 with SHA-256
 * (RFC 7518 §3.4). Both are what remote verifiers that accept tokens by
 * `jwks_uri` expect — a shared HS256 secret cannot be published.
 */
export type AsymmetricAlgorithm = 'EdDSA' | 'ES256';

/**
 * A public JWK as published in a JWKS document: key material plus the `kid`
 * the token header names, the `alg` it may verify, and `use: 'sig'`.
 */
export type PublicJwk = {
  kty: 'OKP' | 'EC';
  crv: 'Ed25519' | 'P-256';
  x: string;
  y?: string;
  kid: string;
  alg: AsymmetricAlgorithm;
  use: 'sig';
};

/** A JSON Web Key Set (RFC 7517 §5), as served at `jwks_uri`. */
export type JsonWebKeySet = { keys: PublicJwk[] };

/**
 * A private signing key, in the form an app keeps in its secret store.
 *
 * Every field is JSON, so the whole object can be serialized into one
 * environment variable or secret and read back unchanged.
 */
export type SigningKey = {
  /** Key id, written to the token header and to the JWKS entry. */
  kid: string;
  alg: AsymmetricAlgorithm;
  /** The private key as a JWK (`d` included). Never publish it. */
  privateJwk: crypto.JsonWebKey;
  /**
   * When the key stopped signing, in milliseconds since epoch. A retired key
   * is still published and still verifies until the longest token it signed
   * has expired — see `createSigningKeySet`.
   */
  retiredAt?: number;
};

const CURVES = {
  EdDSA: { kty: 'OKP', crv: 'Ed25519' },
  ES256: { kty: 'EC', crv: 'P-256' },
} as const satisfies Record<AsymmetricAlgorithm, { kty: string; crv: string }>;

/**
 * The algorithm a JWK's key material implies. Verification derives it from
 * the key, never from the token header alone, so a token cannot pick a weaker
 * algorithm than the key it names (the classic `alg` confusion).
 */
export const algorithmOfJwk = (
  jwk: crypto.JsonWebKey
): AsymmetricAlgorithm | undefined => {
  if (jwk.kty === 'OKP' && jwk.crv === 'Ed25519') {
    return 'EdDSA';
  }
  if (jwk.kty === 'EC' && jwk.crv === 'P-256') {
    return 'ES256';
  }
  return undefined;
};

/**
 * RFC 7638 JWK thumbprint: SHA-256 over the required members in
 * lexicographic order. Used as the default `kid`, so the id is derived from
 * the key and two keys never share one by accident.
 */
const thumbprint = (jwk: crypto.JsonWebKey): string => {
  const members =
    jwk.kty === 'EC'
      ? { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }
      : { crv: jwk.crv, kty: jwk.kty, x: jwk.x };
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(members))
    .digest('base64url');
};

/**
 * Generates a fresh asymmetric signing key.
 *
 * Run it once per key (e.g. from a script), store the result in the app's
 * secret store, and feed it to `createSigningKeySet`. The `kid` defaults to
 * the key's RFC 7638 thumbprint.
 *
 * @example
 * ```typescript
 * const key = generateSigningKey({ alg: 'EdDSA' });
 * // Store JSON.stringify(key) as a secret.
 * ```
 */
export const generateSigningKey = (
  args: { alg?: AsymmetricAlgorithm; kid?: string } = {}
): SigningKey => {
  const alg = args.alg ?? 'EdDSA';
  const { privateKey } =
    alg === 'EdDSA'
      ? crypto.generateKeyPairSync('ed25519')
      : crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const privateJwk = privateKey.export({ format: 'jwk' });
  return { kid: args.kid ?? thumbprint(privateJwk), alg, privateJwk };
};

/**
 * Checks that a signing key's material matches its declared algorithm, so a
 * misconfigured secret fails at startup rather than on the first token.
 */
export const assertSigningKey = (key: SigningKey): void => {
  if (!key.kid) {
    throw new Error('A signing key needs a non-empty kid.');
  }
  if (algorithmOfJwk(key.privateJwk) !== key.alg) {
    throw new Error(
      `Signing key ${key.kid} declares ${key.alg} but its key material does not match (expected ${CURVES[key.alg].kty}/${CURVES[key.alg].crv}).`
    );
  }
  if (typeof key.privateJwk.d !== 'string') {
    throw new Error(`Signing key ${key.kid} has no private part (d).`);
  }
};

/** The publishable half of a signing key, as a JWKS entry. */
export const toPublicJwk = (key: SigningKey): PublicJwk => {
  const { kty, crv } = CURVES[key.alg];
  return {
    kty,
    crv,
    x: key.privateJwk.x as string,
    ...(key.alg === 'ES256' ? { y: key.privateJwk.y as string } : {}),
    kid: key.kid,
    alg: key.alg,
    use: 'sig',
  };
};

/** Signs `input` with a private signing key; returns the base64url signature. */
export const signWithKey = (args: {
  input: string;
  key: SigningKey;
}): string => {
  const keyObject = crypto.createPrivateKey({
    key: args.key.privateJwk,
    format: 'jwk',
  });
  const data = Buffer.from(args.input);
  const signature =
    args.key.alg === 'EdDSA'
      ? crypto.sign(null, data, keyObject)
      : crypto.sign('sha256', data, {
          key: keyObject,
          dsaEncoding: 'ieee-p1363',
        });
  return signature.toString('base64url');
};

/** Verifies a base64url signature over `input` against a public JWK. */
export const verifyWithJwk = (args: {
  input: string;
  signature: string;
  jwk: PublicJwk;
}): boolean => {
  const alg = algorithmOfJwk(args.jwk);
  if (!alg || alg !== args.jwk.alg) {
    return false;
  }
  const keyObject = crypto.createPublicKey({
    key: args.jwk as crypto.JsonWebKey,
    format: 'jwk',
  });
  const data = Buffer.from(args.input);
  const signature = Buffer.from(args.signature, 'base64url');
  return alg === 'EdDSA'
    ? crypto.verify(null, data, keyObject, signature)
    : crypto.verify(
        'sha256',
        data,
        { key: keyObject, dsaEncoding: 'ieee-p1363' },
        signature
      );
};
