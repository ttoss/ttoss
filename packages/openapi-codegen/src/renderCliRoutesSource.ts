import type { Route } from './generateCliRoutes';

const renderRouteEntry = (command: string, route: Route): string => {
  const flags = JSON.stringify(route.flags);
  return `  '${command}': { serviceClass: '${route.serviceClass}', operationId: '${route.operationId}', description: ${JSON.stringify(route.description)}, moduleDocsUrl: ${JSON.stringify(route.moduleDocsUrl)}, httpMethod: '${route.httpMethod}', pathParams: ${JSON.stringify(route.pathParams)}, queryParams: ${JSON.stringify(route.queryParams)}, flags: ${flags} },`;
};

/**
 * Renders a route manifest (from {@link generateCliRouteManifest}) as a
 * standalone TypeScript source file exporting `Route`, `Flag`, and `routes`.
 */
export const renderCliRoutesSource = (
  routes: Record<string, Route>
): string => {
  const lines = [
    '// AUTO-GENERATED — do not edit. Regenerate via @ttoss/openapi-codegen.',
    '',
    'export interface Route {',
    '  serviceClass: string;',
    '  operationId: string;',
    '  /** operation summary/description */',
    '  description: string;',
    '  /** URL to module documentation page */',
    '  moduleDocsUrl: string;',
    '  /** HTTP method the operation is mounted on */',
    "  httpMethod: 'get' | 'post' | 'put' | 'patch' | 'delete';",
    '  /** snake_case path parameter names */',
    '  pathParams: string[];',
    '  /** snake_case query parameter names */',
    '  queryParams: string[];',
    '  /** snake_case flags (path, query, body) with metadata for --help. */',
    '  flags: Flag[];',
    '}',
    '',
    '/** Metadata for a single CLI flag, used to render --help output. */',
    'export interface Flag {',
    '  name: string;',
    '  description: string;',
    '  required: boolean;',
    '  type: string;',
    "  in: 'path' | 'query' | 'body';",
    '}',
    '',
    'export const routes: Record<string, Route> = {',
    ...Object.entries(routes).map(([command, route]) => {
      return renderRouteEntry(command, route);
    }),
    '};',
    '',
  ];

  return lines.join('\n');
};
