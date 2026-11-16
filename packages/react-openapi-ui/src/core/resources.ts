import { listOperations } from './operations';
import { humanizeKey } from './table';
import type { OpenApiSpec, ResolvedOperation } from './types';

/**
 * An operation of a resource that is not one of its CRUD operations, e.g.
 * `POST /clients/{client_id}/send-email`. `item` actions act on one record
 * (their path holds the record id); `collection` actions do not.
 */
export type ResourceAction = {
  /** The operation's `operationId`. */
  key: string;
  /** Humanized last static path segment, e.g. "Send Email". */
  label: string;
  scope: 'item' | 'collection';
  operation: ResolvedOperation;
};

/**
 * A REST resource read from the spec: the operations of one tag, each given
 * its role by HTTP method and path shape, the way an admin UI needs them.
 */
export type ApiResource = {
  /** URL-safe identifier, used in locations (`clients`). */
  key: string;
  /** The tag the operations share, or the path segment of untagged ones. */
  tag: string;
  /** Display name (`Clients`). */
  label: string;
  /** Last static segment of the collection path (`clients`); `x-ref` targets it. */
  segment?: string;
  /** The path param naming one record (`client_id`). */
  idParam?: string;
  /**
   * Path params the resource's paths need besides `idParam`: a nested
   * resource (`/agents/{agent_id}/versions`) can only be listed with its
   * parent's id, given through `params`.
   */
  scopeParams: string[];
  /** GET on the collection path. */
  list?: ResolvedOperation;
  /** GET on the item path. */
  get?: ResolvedOperation;
  /** POST on the collection path. */
  create?: ResolvedOperation;
  /** PATCH (preferred) or PUT on the item path. */
  update?: ResolvedOperation;
  /** DELETE on the item path. */
  delete?: ResolvedOperation;
  /** Every other write (POST/PUT/PATCH/DELETE) of the tag. */
  actions: ResourceAction[];
};

export type ParseResourcesOptions = {
  /** Only paths starting with this prefix are read (e.g. `/api/v1`). */
  pathPrefix?: string;
  /**
   * Only these tags become resources, in this order. Omit to take every tag
   * in the order the spec first uses it.
   */
  tags?: string[];
};

const segmentsOf = (pathTemplate: string): string[] => {
  return pathTemplate.split('/').filter(Boolean);
};

const isParam = (segment: string): boolean => {
  return segment.startsWith('{') && segment.endsWith('}');
};

/** A collection path ends in a static segment (`/clients`), an item path in a param. */
const isCollectionPath = (pathTemplate: string): boolean => {
  const last = segmentsOf(pathTemplate).pop();
  return !!last && !isParam(last);
};

const lastStaticSegment = (pathTemplate: string): string | undefined => {
  return segmentsOf(pathTemplate)
    .filter((segment) => {
      return !isParam(segment);
    })
    .pop();
};

const lastParam = (pathTemplate: string): string | undefined => {
  const last = segmentsOf(pathTemplate).pop();
  return last && isParam(last) ? last.slice(1, -1) : undefined;
};

/** Version and API prefixes say nothing about the resource. */
const PREFIX_SEGMENT = /^(api|rest|v\d+(\.\d+)*)$/i;

/** The group of an untagged operation: its first meaningful static segment. */
const untaggedGroup = (pathTemplate: string): string => {
  return (
    segmentsOf(pathTemplate).find((segment) => {
      return !isParam(segment) && !PREFIX_SEGMENT.test(segment);
    }) ?? 'default'
  );
};

const slugify = (text: string): string => {
  return (
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resource'
  );
};

const groupByTag = ({
  operations,
  tags,
}: {
  operations: ResolvedOperation[];
  tags?: string[];
}): Map<string, ResolvedOperation[]> => {
  const groups = new Map<string, ResolvedOperation[]>(
    (tags ?? []).map((tag) => {
      return [tag, []];
    })
  );
  for (const operation of operations) {
    const opTags = operation.operation.tags?.length
      ? operation.operation.tags
      : [untaggedGroup(operation.pathTemplate)];
    for (const tag of opTags) {
      if (tags && !tags.includes(tag)) {
        continue;
      }
      groups.set(tag, [...(groups.get(tag) ?? []), operation]);
    }
  }
  return groups;
};

/** Whether `path` is `collection` plus one param (`/clients/{client_id}`). */
const isItemOf = ({
  path,
  collection,
}: {
  path: string;
  collection: string;
}): boolean => {
  return (
    path.startsWith(`${collection}/`) &&
    segmentsOf(path).length === segmentsOf(collection).length + 1 &&
    !isCollectionPath(path)
  );
};

/**
 * The collection path and the item path (the collection path plus one param,
 * else the shortest item-shaped path) of a group of operations. The
 * collection path is the shortest collection-shaped GET that has an item
 * path, so `/usage/thresholds` wins over `/usage/aggregate`; without one, the
 * shortest collection-shaped GET.
 */
const findPaths = (
  sorted: ResolvedOperation[]
): { collection?: string; item?: string } => {
  const lists = sorted.filter((op) => {
    return op.method === 'get' && isCollectionPath(op.pathTemplate);
  });
  const hasItem = (collection: string) => {
    return sorted.some((op) => {
      return isItemOf({ path: op.pathTemplate, collection });
    });
  };
  const collection = (
    lists.find((op) => {
      return hasItem(op.pathTemplate);
    }) ?? lists[0]
  )?.pathTemplate;
  const itemShaped = sorted.filter((op) => {
    return !isCollectionPath(op.pathTemplate);
  });
  const item = (
    itemShaped.find((op) => {
      return !!collection && isItemOf({ path: op.pathTemplate, collection });
    }) ?? itemShaped[0]
  )?.pathTemplate;
  return { collection, item };
};

const pathParams = (pathTemplate: string): string[] => {
  return segmentsOf(pathTemplate)
    .filter(isParam)
    .map((segment) => {
      return segment.slice(1, -1);
    });
};

const toAction = ({
  operation,
  item,
  idParam,
  segment,
}: {
  operation: ResolvedOperation;
  item?: string;
  idParam?: string;
  segment?: string;
}): ResourceAction => {
  const onItem =
    !!idParam &&
    !!item &&
    (operation.pathTemplate === item ||
      operation.pathTemplate.startsWith(`${item}/`));
  const pathName = lastStaticSegment(operation.pathTemplate);
  return {
    key: operation.operation.operationId,
    // A write on the resource's own path (`POST /clients/{id}`) has no verb
    // in the path; its operationId names it instead.
    label: humanizeKey(
      pathName && pathName !== segment
        ? pathName
        : operation.operation.operationId
    ),
    scope: onItem ? 'item' : 'collection',
    operation,
  };
};

type CrudRole = 'list' | 'get' | 'create' | 'update' | 'delete';

/** The CRUD role an operation takes, or undefined when it is an action. */
const crudRole = ({
  operation,
  collection,
  item,
}: {
  operation: ResolvedOperation;
  collection?: string;
  item?: string;
}): CrudRole | 'ignored' | undefined => {
  const { method, pathTemplate } = operation;
  const onCollection = pathTemplate === collection;
  const onItem = pathTemplate === item;
  if (method === 'get') {
    if (onCollection) {
      return 'list';
    }
    // Reads off the collection/item paths (sub-resources) are not shown.
    return onItem ? 'get' : 'ignored';
  }
  if (method === 'post') {
    return onCollection ? 'create' : undefined;
  }
  if (!onItem) {
    return undefined;
  }
  return method === 'delete' ? 'delete' : 'update';
};

/**
 * Whether an operation takes a CRUD role: the first one does, except that a
 * PATCH (which edits only what changed) wins over a PUT.
 */
const takesRole = ({
  resource,
  role,
  operation,
}: {
  resource: ApiResource;
  role: CrudRole;
  operation: ResolvedOperation;
}): boolean => {
  const current = resource[role];
  return (
    !current ||
    (role === 'update' &&
      operation.method === 'patch' &&
      current.method === 'put')
  );
};

const buildResource = ({
  tag,
  key,
  label,
  operations,
}: {
  tag: string;
  key: string;
  label: string;
  operations: ResolvedOperation[];
}): ApiResource => {
  // Shallow paths first, so the collection and item paths win over sub-paths.
  const sorted = [...operations].sort((a, b) => {
    return (
      segmentsOf(a.pathTemplate).length - segmentsOf(b.pathTemplate).length
    );
  });
  const { collection, item } = findPaths(sorted);
  const idParam = item ? lastParam(item) : undefined;
  const resource: ApiResource = {
    key,
    tag,
    label,
    segment: lastStaticSegment(collection ?? item ?? ''),
    idParam,
    scopeParams: pathParams(collection ?? item ?? '').filter((name) => {
      return name !== idParam;
    }),
    actions: [],
  };
  for (const operation of sorted) {
    const role = crudRole({ operation, collection, item });
    if (!role) {
      resource.actions.push(
        toAction({ operation, item, idParam, segment: resource.segment })
      );
    } else if (role !== 'ignored' && takesRole({ resource, role, operation })) {
      resource[role] = operation;
    }
  }
  return resource;
};

type ResourceGroup = {
  tag: string;
  key: string;
  label: string;
  operations: ResolvedOperation[];
};

/**
 * One tag may hold several collections (`/datasets` and `/evals` under
 * "Evaluations"). Each first path segment with a collection GET becomes a
 * resource of its own, named after the segment unless it is the tag's name;
 * operations of the other segments (`/activity/export`-like extras) stay with
 * the first group.
 */
const splitTag = ({
  tag,
  operations,
}: {
  tag: string;
  operations: ResolvedOperation[];
}): ResourceGroup[] => {
  const whole = {
    tag,
    key: slugify(tag),
    label: humanizeKey(tag),
    operations,
  };
  const roots = new Map<string, ResolvedOperation[]>();
  for (const operation of operations) {
    const root = untaggedGroup(operation.pathTemplate);
    roots.set(root, [...(roots.get(root) ?? []), operation]);
  }
  const listed = Array.from(roots.entries()).filter(([, group]) => {
    return group.some((op) => {
      return op.method === 'get' && isCollectionPath(op.pathTemplate);
    });
  });
  if (listed.length <= 1) {
    return [whole];
  }
  const groups = listed.map(([root, group]) => {
    const own = slugify(root) === whole.key;
    return {
      tag,
      key: own ? whole.key : slugify(root),
      label: own ? whole.label : humanizeKey(root),
      operations: group,
    };
  });
  const rest = Array.from(roots.entries())
    .filter(([root]) => {
      return !listed.some(([listedRoot]) => {
        return listedRoot === root;
      });
    })
    .flatMap(([, group]) => {
      return group;
    });
  groups[0] = { ...groups[0], operations: [...groups[0].operations, ...rest] };
  return groups;
};

/** Keys are unique: a repeated key gets a numeric suffix. */
const withUniqueKeys = (groups: ResourceGroup[]): ResourceGroup[] => {
  const seen = new Map<string, number>();
  return groups.map((group) => {
    const count = (seen.get(group.key) ?? 0) + 1;
    seen.set(group.key, count);
    return count === 1 ? group : { ...group, key: `${group.key}-${count}` };
  });
};

/**
 * Reads the spec as a set of REST resources, the way an admin UI needs it:
 * operations are grouped by tag (untagged ones by their first path segment
 * after `api`/`v1`; a tag holding several collections is split by them), and
 * each takes a role from its method and path shape —
 * `GET /clients` lists, `POST /clients` creates, `GET`/`PATCH`/`DELETE
 * /clients/{client_id}` read, update and delete one record, and any other
 * write becomes an action. The spec carries no UI instructions; the roles are
 * conventions.
 *
 * @example
 * parseResources({ spec })[0]; // { key: 'clients', list: …, create: …, actions: [] }
 */
export const parseResources = ({
  spec,
  pathPrefix,
  tags,
}: { spec: OpenApiSpec } & ParseResourcesOptions): ApiResource[] => {
  const operations = listOperations(spec).filter((operation) => {
    return !pathPrefix || operation.pathTemplate.startsWith(pathPrefix);
  });
  const groups = Array.from(groupByTag({ operations, tags }).entries())
    .filter(([, group]) => {
      return group.length > 0;
    })
    .flatMap(([tag, group]) => {
      return splitTag({ tag, operations: group });
    });
  return withUniqueKeys(groups).map(buildResource);
};

/** The resource with this `key`. */
export const findResource = ({
  resources,
  key,
}: {
  resources: ApiResource[];
  key: string;
}): ApiResource | undefined => {
  return resources.find((resource) => {
    return resource.key === key;
  });
};

export type { OpenApiLocation } from './locations';
export { formatLocation, parseLocation } from './locations';
export {
  findResourceByRef,
  getRecordId,
  getRefName,
  isListable,
  toRefOption,
} from './references';
