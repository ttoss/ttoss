const segmentsOf = (path: string): string[] => {
  return path.split('/').filter(Boolean);
};

// ─── Locations ───────────────────────────────────────────────────────────────

/**
 * A screen of a resource. Apps keep it in their router; `formatLocation` and
 * `parseLocation` convert it to and from a path.
 */
export type OpenApiLocation =
  | { resource: string; view: 'list' | 'create' }
  | { resource: string; view: 'detail' | 'edit'; id: string }
  | { resource: string; view: 'action'; action: string; id?: string };

const enc = encodeURIComponent;

/**
 * A location as a path: `/clients`, `/clients/new`, `/clients/c1`,
 * `/clients/c1/edit`, `/clients/c1/actions/sendClientEmail` or
 * `/clients/actions/importClients`. `new` and `actions` are reserved.
 */
export const formatLocation = (location: OpenApiLocation): string => {
  const base = `/${enc(location.resource)}`;
  switch (location.view) {
    case 'list':
      return base;
    case 'create':
      return `${base}/new`;
    case 'detail':
      return `${base}/${enc(location.id)}`;
    case 'edit':
      return `${base}/${enc(location.id)}/edit`;
    case 'action':
      return location.id === undefined
        ? `${base}/actions/${enc(location.action)}`
        : `${base}/${enc(location.id)}/actions/${enc(location.action)}`;
  }
};

/** Reads a path written by `formatLocation`; undefined when it is not one. */
export const parseLocation = (path: string): OpenApiLocation | undefined => {
  const parts = segmentsOf(path.split(/[?#]/)[0]).map(decodeURIComponent);
  const [resource, a, b, c] = parts;
  if (!resource || parts.length > 4) {
    return undefined;
  }
  if (parts.length === 1) {
    return { resource, view: 'list' };
  }
  if (parts.length === 2) {
    return a === 'new'
      ? { resource, view: 'create' }
      : { resource, view: 'detail', id: a };
  }
  if (parts.length === 3) {
    if (a === 'actions') {
      return { resource, view: 'action', action: b };
    }
    return b === 'edit' ? { resource, view: 'edit', id: a } : undefined;
  }
  return b === 'actions'
    ? { resource, view: 'action', action: c, id: a }
    : undefined;
};
