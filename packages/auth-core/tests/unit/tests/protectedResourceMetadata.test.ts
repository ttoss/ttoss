import {
  protectedResourceMetadataDocument,
  protectedResourceMetadataPaths,
  protectedResourceMetadataUrl,
} from 'src/protectedResourceMetadata';

describe('protectedResourceMetadataDocument', () => {
  test('builds the RFC 9728 document', () => {
    expect(
      protectedResourceMetadataDocument({
        resource: 'https://mcp.example.com/mcp',
        authorizationServers: ['https://auth.example.com'],
      })
    ).toEqual({
      resource: 'https://mcp.example.com/mcp',
      authorization_servers: ['https://auth.example.com'],
    });
  });
});

describe('protectedResourceMetadataPaths', () => {
  test('derives the path-bearing location first, then the root', () => {
    expect(
      protectedResourceMetadataPaths({ resource: 'https://host/mcp' })
    ).toEqual([
      '/.well-known/oauth-protected-resource/mcp',
      '/.well-known/oauth-protected-resource',
    ]);
  });

  test('keeps every segment of a multi-segment path', () => {
    expect(
      protectedResourceMetadataPaths({ resource: 'https://host/api/v1/mcp' })
    ).toEqual([
      '/.well-known/oauth-protected-resource/api/v1/mcp',
      '/.well-known/oauth-protected-resource',
    ]);
  });

  test('returns the root alone for an origin-only resource', () => {
    expect(
      protectedResourceMetadataPaths({ resource: 'https://host' })
    ).toEqual(['/.well-known/oauth-protected-resource']);
  });

  test('treats a bare trailing slash as no path, not as a path', () => {
    // Otherwise the same resource would be served at two spellings of the
    // root, and `new URL` normalises an empty path to '/'.
    expect(
      protectedResourceMetadataPaths({ resource: 'https://host/' })
    ).toEqual(['/.well-known/oauth-protected-resource']);
  });

  test('ignores a trailing slash after a path', () => {
    expect(
      protectedResourceMetadataPaths({ resource: 'https://host/mcp/' })
    ).toEqual([
      '/.well-known/oauth-protected-resource/mcp',
      '/.well-known/oauth-protected-resource',
    ]);
  });

  test('falls back to the root for a value that is not an absolute URL', () => {
    // Wiring-time robustness: a misconfigured resource must not throw while
    // routes are being registered.
    expect(protectedResourceMetadataPaths({ resource: 'not a url' })).toEqual([
      '/.well-known/oauth-protected-resource',
    ]);
  });
});

describe('protectedResourceMetadataUrl', () => {
  test('inserts the well-known segment between host and path (RFC 9728 §3.1)', () => {
    expect(protectedResourceMetadataUrl({ resource: 'https://host/mcp' })).toBe(
      'https://host/.well-known/oauth-protected-resource/mcp'
    );
  });

  test('appends to the origin when the resource has no path', () => {
    expect(protectedResourceMetadataUrl({ resource: 'https://host' })).toBe(
      'https://host/.well-known/oauth-protected-resource'
    );
  });

  test('drops a port-less origin mismatch by using the resource origin', () => {
    expect(
      protectedResourceMetadataUrl({ resource: 'https://host:8443/api/mcp' })
    ).toBe('https://host:8443/.well-known/oauth-protected-resource/api/mcp');
  });

  test('falls back to the trimmed value when it is not an absolute URL', () => {
    expect(protectedResourceMetadataUrl({ resource: 'not a url' })).toBe(
      'not a url/.well-known/oauth-protected-resource'
    );
  });
});
