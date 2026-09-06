import type {
  McpServer,
  RegisteredResource,
} from '@modelcontextprotocol/server';

/**
 * Identifier of the MCP Apps extension (`io.modelcontextprotocol/ui`), used as
 * the key under `capabilities.extensions` on both sides of the handshake.
 *
 * A client declares Apps support with it; a server may advertise the same key
 * so a host can discover the support without inspecting tool metadata:
 *
 * ```typescript
 * new McpServer(
 *   { name: 'weather', version: '1.0.0' },
 *   {
 *     capabilities: {
 *       extensions: {
 *         [UI_EXTENSION_ID]: { mimeTypes: [UI_RESOURCE_MIME_TYPE] },
 *       },
 *     },
 *   }
 * );
 * ```
 */
export const UI_EXTENSION_ID = 'io.modelcontextprotocol/ui';

/** MIME type every MCP Apps HTML resource is served as. */
export const UI_RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app';

/**
 * Deprecated flat tool metadata key for the linked resource URI. Written
 * alongside `_meta.ui.resourceUri` because both forms are legal until the
 * extension reaches GA, at which point this key is removed from the spec.
 */
const LEGACY_RESOURCE_URI_KEY = 'ui/resourceUri';

/**
 * Origins an app's view is allowed to reach, mapped by the host onto the
 * iframe's Content Security Policy. Anything not declared is blocked: an
 * omitted list is the restrictive default, not "no restriction".
 */
export interface UiResourceCsp {
  /** Origins for network requests (`connect-src`). */
  connectDomains?: string[];
  /**
   * Origins for scripts, styles, images, fonts and media (`script-src`,
   * `style-src`, `img-src`, `font-src`, `media-src`).
   */
  resourceDomains?: string[];
  /** Origins for nested iframes (`frame-src`). */
  frameDomains?: string[];
  /** Allowed document base URIs (`base-uri`). */
  baseUriDomains?: string[];
}

/**
 * Browser capabilities the view asks for. A host *may* grant them, so a view
 * should feature-detect rather than assume: each key is a request, not a
 * guarantee.
 */
export interface UiResourcePermissions {
  camera?: Record<string, never>;
  microphone?: Record<string, never>;
  geolocation?: Record<string, never>;
  clipboardWrite?: Record<string, never>;
}

/** Rendering and security configuration for an app's view (`_meta.ui`). */
export interface UiResourceMeta {
  /** Origins the view may reach; omitted means none. */
  csp?: UiResourceCsp;
  /** Browser capabilities requested for the view. */
  permissions?: UiResourcePermissions;
  /**
   * Dedicated sandbox origin for the view, for cases needing a stable origin
   * (OAuth callbacks, CORS, API key allowlists). The accepted format is
   * host-specific; consult the host's documentation rather than deriving one.
   */
  domain?: string;
  /** Whether the host should draw a border and background around the view. */
  prefersBorder?: boolean;
}

/** Who may reach a tool. Defaults to both when left unset. */
export type UiToolVisibility = 'model' | 'app';

/** Parameters for {@link registerAppResource}. */
export interface RegisterAppResourceParams {
  /** The `McpServer` instance to register the app resource on. */
  server: McpServer;
  /** Resource name, as listed by `resources/list`. */
  name: string;
  /** Resource URI. Must use the `ui://` scheme. */
  uri: string;
  /** What the view does and when a host should render it. */
  description?: string;
  /**
   * The view's HTML5 document, or a builder invoked per `resources/read`.
   * A builder receives the requested URI so one registration can serve
   * variants of a document.
   */
  html: string | ((args: { uri: URL }) => string | Promise<string>);
  /** Rendering and security configuration relayed to the host as `_meta.ui`. */
  ui?: UiResourceMeta;
}

/** Parameters for {@link RegisteredAppResource.toolMeta}. */
export interface ToolMetaParams {
  /**
   * Who may reach the tool. Left unset, the spec's default applies — visible
   * to the model *and* callable by the app.
   */
  visibility?: UiToolVisibility[];
  /** Further `_meta` entries to merge in, e.g. vendor-namespaced keys. */
  _meta?: Record<string, unknown>;
}

/** An app resource registered by {@link registerAppResource}. */
export interface RegisteredAppResource {
  /** The URI tools link to. */
  uri: string;
  /** The SDK's registration handle, for `update`/`disable`/`remove`. */
  resource: RegisteredResource;
  /**
   * Builds the `_meta` bag that links a tool to this view. Pass it to
   * `registerTool`, {@link registerToolFromSchema}, or a `GatedToolDef` —
   * whichever registration path the tool uses.
   */
  toolMeta: (params?: ToolMetaParams) => Record<string, unknown>;
}

/**
 * Registers an MCP Apps view: a `ui://` resource a tool result is rendered
 * with, per the `io.modelcontextprotocol/ui` extension.
 *
 * The extension asks nothing of the transport — a view is an ordinary MCP
 * resource, and the tool linkage is ordinary tool `_meta` — so this is
 * registration sugar over `registerResource`, not new protocol surface. What
 * it owns is the part that is easy to get wrong: the `ui://` scheme, the exact
 * MIME type, `_meta.ui` on both the declaration and the read result, and
 * writing the deprecated flat linkage key alongside the current one.
 *
 * **Register the linkage unconditionally.** The extension's negotiation is
 * per-request and only reliably readable on the `2026-07-28` revision; in this
 * package's default stateless 2025-era mode there is no remembered
 * `initialize` to read a client capability from. Gating registration on that
 * capability would therefore silently drop the view for every 2025-era client.
 * A host without Apps support simply ignores `_meta`, so keep each tool's
 * `content` meaningful on its own and let the text result be the fallback.
 *
 * @example
 * ```typescript
 * import {
 *   McpServer,
 *   registerAppResource,
 *   UI_EXTENSION_ID,
 *   UI_RESOURCE_MIME_TYPE,
 *   z,
 * } from '@ttoss/http-server-mcp';
 *
 * const server = new McpServer(
 *   { name: 'weather', version: '1.0.0' },
 *   {
 *     capabilities: {
 *       extensions: { [UI_EXTENSION_ID]: { mimeTypes: [UI_RESOURCE_MIME_TYPE] } },
 *     },
 *   }
 * );
 *
 * const dashboard = registerAppResource({
 *   server,
 *   name: 'weather_dashboard',
 *   uri: 'ui://weather/dashboard',
 *   description: 'Interactive weather dashboard',
 *   html: dashboardHtml,
 *   ui: {
 *     csp: { connectDomains: ['https://api.openweathermap.org'] },
 *     prefersBorder: true,
 *   },
 * });
 *
 * server.registerTool(
 *   'get-weather',
 *   {
 *     description: 'Get the weather for a location',
 *     inputSchema: { location: z.string() },
 *     _meta: dashboard.toolMeta(),
 *   },
 *   async ({ location }) => {
 *     const forecast = await fetchForecast(location);
 *     return {
 *       // Text stays meaningful: it is what a host without Apps renders.
 *       content: [{ type: 'text', text: summarise(forecast) }],
 *       structuredContent: forecast,
 *     };
 *   }
 * );
 * ```
 */
export const registerAppResource = ({
  server,
  name,
  uri,
  description,
  html,
  ui,
}: RegisterAppResourceParams): RegisteredAppResource => {
  if (!uri.startsWith('ui://')) {
    throw new Error(
      `An MCP Apps resource URI must use the ui:// scheme (received "${uri}").`
    );
  }

  const meta = ui === undefined ? undefined : { ui };

  const resource = server.registerResource(
    name,
    uri,
    {
      description,
      mimeType: UI_RESOURCE_MIME_TYPE,
      ...(meta === undefined ? {} : { _meta: meta }),
    },
    async (requestedUri: URL) => {
      const text =
        typeof html === 'string' ? html : await html({ uri: requestedUri });

      return {
        contents: [
          {
            uri: requestedUri.href,
            mimeType: UI_RESOURCE_MIME_TYPE,
            text,
            ...(meta === undefined ? {} : { _meta: meta }),
          },
        ],
      };
    }
  );

  const toolMeta = ({ visibility, _meta }: ToolMetaParams = {}) => {
    return {
      ..._meta,
      ui: {
        resourceUri: uri,
        ...(visibility === undefined ? {} : { visibility }),
      },
      [LEGACY_RESOURCE_URI_KEY]: uri,
    };
  };

  return { uri, resource, toolMeta };
};
