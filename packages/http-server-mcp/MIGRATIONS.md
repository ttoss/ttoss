# Migrations

## `tools/list` is no longer public by default

`auth.publicMethods` now defaults to `['initialize']` instead of
`['initialize', 'tools/list']`. A server with `auth` configured no longer
serves its tool catalogue to unauthenticated callers.

```diff
 createMcpRouter(mcpServer, {
   auth: {
     cognitoUserPool: { userPoolId: '...', clientId: '...' },
+    // Only needed if unauthenticated callers must keep listing tools.
+    publicMethods: ['initialize', 'tools/list'],
   },
 });
```

**What you will observe if you miss this.** An unauthenticated `tools/list`
returns `401` with `WWW-Authenticate: Bearer resource_metadata="…"` instead of
`200` and the catalogue. It fails on the first such request rather than on
particular inputs, so a smoke test against a deployed server surfaces it
immediately.

**Who is affected.** Only consumers that configure `auth` and never set
`publicMethods`. Anyone already passing `publicMethods` — including
`publicMethods: []` — is unaffected, and so is any server without `auth`.

**Who should not restore the old value.** OAuth clients do not need it. The
`401` and its RFC 9728 challenge are what start the authorization flow, and a
client that lists tools anonymously still cannot call one; the flow reaches the
authorization redirect identically with `tools/list` open or closed. Restore it
only to serve callers that will never authenticate, and note what that exposes:
every tool name, description, and input schema, which for an OpenAPI-derived
server is a map of the whole underlying API.

The one-time startup warning that pre-announced this change is gone, since the
default it warned about is now the secure one.
