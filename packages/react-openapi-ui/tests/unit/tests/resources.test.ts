import {
  type ApiResource,
  findResource,
  findResourceByRef,
  formatLocation,
  getFieldKind,
  getRecordId,
  getRefName,
  listOperations,
  type OpenApiLocation,
  parseFieldValue,
  parseLocation,
  parseResources,
  toRefOption,
} from '../../../src/core';
import { shopSpec } from '../resourcesFixtures';

const summarize = (resource: ApiResource) => {
  return {
    key: resource.key,
    tag: resource.tag,
    label: resource.label,
    segment: resource.segment,
    idParam: resource.idParam,
    list: resource.list?.operation.operationId,
    get: resource.get?.operation.operationId,
    create: resource.create?.operation.operationId,
    update: resource.update?.operation.operationId,
    delete: resource.delete?.operation.operationId,
    actions: resource.actions.map((action) => {
      return `${action.key}:${action.scope}:${action.label}`;
    }),
  };
};

describe('parseResources', () => {
  test('groups operations by tag and gives each a role by method and path', () => {
    expect(parseResources({ spec: shopSpec }).map(summarize)).toEqual([
      {
        key: 'clients',
        tag: 'Clients',
        label: 'Clients',
        segment: 'clients',
        idParam: 'client_id',
        list: 'listClients',
        get: 'getClient',
        create: 'createClient',
        // PATCH wins over the PUT on the same path.
        update: 'updateClient',
        delete: 'deleteClient',
        // The sub-resource read (listClientOrders) is left out.
        actions: [
          'importClients:collection:Import',
          'touchClient:item:Touch Client',
          'sendClientEmail:item:Send Email',
        ],
      },
      {
        key: 'orders',
        tag: 'Orders',
        label: 'Orders',
        segment: 'orders',
        idParam: 'order_id',
        list: 'listOrders',
        get: 'getOrder',
        create: 'createOrder',
        update: undefined,
        delete: undefined,
        actions: [],
      },
      {
        key: 'notes',
        tag: 'Notes',
        label: 'Notes',
        segment: 'notes',
        idParam: undefined,
        list: 'listNotes',
        get: undefined,
        create: undefined,
        update: undefined,
        delete: undefined,
        actions: [],
      },
      {
        // Untagged: grouped by the first path segment after `api`/`v1`.
        key: 'health',
        tag: 'health',
        label: 'Health',
        segment: 'health',
        idParam: undefined,
        list: 'getHealth',
        get: undefined,
        create: undefined,
        update: undefined,
        delete: undefined,
        actions: [],
      },
      {
        key: 'auth',
        tag: 'Auth',
        label: 'Auth',
        segment: undefined,
        idParam: undefined,
        list: undefined,
        get: undefined,
        create: undefined,
        update: undefined,
        delete: undefined,
        actions: ['issueToken:collection:Token'],
      },
    ]);
  });

  test('reads only paths under pathPrefix and only the given tags, in order', () => {
    expect(
      parseResources({ spec: shopSpec, pathPrefix: '/api/v1' }).map((r) => {
        return r.key;
      })
    ).toEqual(['clients', 'orders', 'notes', 'health']);
    expect(
      parseResources({
        spec: shopSpec,
        tags: ['Orders', 'Clients', 'Missing'],
      }).map((r) => {
        return r.key;
      })
    ).toEqual(['orders', 'clients']);
  });

  test('derives keys and groups from unusual tags and paths', () => {
    const resources = parseResources({
      spec: {
        paths: {
          '/': { get: { operationId: 'root' } },
          '/api/v2/{id}': { get: { operationId: 'byId' } },
          '/things': {
            get: { operationId: 'listThings', tags: ['Ação & Coisas'] },
          },
          '/x': { get: { operationId: 'symbols', tags: ['***'] } },
        },
      },
    });
    expect(
      resources.map((r) => {
        return [r.key, r.tag, r.idParam];
      })
    ).toEqual([
      ['default', 'default', undefined],
      ['acao-coisas', 'Ação & Coisas', undefined],
      ['resource', '***', undefined],
    ]);
  });

  test('takes the shortest item-shaped path when there is no collection', () => {
    const [resource] = parseResources({
      spec: {
        paths: {
          '/settings/{key}': {
            get: { operationId: 'getSetting', tags: ['Settings'] },
            put: { operationId: 'putSetting', tags: ['Settings'] },
          },
        },
      },
    });
    expect(summarize(resource)).toMatchObject({
      segment: 'settings',
      idParam: 'key',
      get: 'getSetting',
      update: 'putSetting',
    });
  });

  test('writes off the item path are actions; own params override path ones', () => {
    const [resource] = parseResources({
      spec: {
        paths: {
          '/users': { get: { operationId: 'listUsers', tags: ['Users'] } },
          '/users/{user_id}': {
            parameters: [
              { name: 'user_id', in: 'path', required: true },
              { name: 'expand', in: 'query' },
            ],
            get: {
              operationId: 'getUser',
              tags: ['Users'],
              parameters: [
                {
                  name: 'user_id',
                  in: 'path',
                  required: true,
                  description: 'own',
                },
              ],
            },
          },
          '/users/{user_id}/policies': {
            put: { operationId: 'setUserPolicies', tags: ['Users'] },
            delete: { operationId: 'clearUserPolicies', tags: ['Users'] },
          },
        },
      },
    });
    expect(summarize(resource).actions).toEqual([
      'setUserPolicies:item:Policies',
      'clearUserPolicies:item:Policies',
    ]);
    expect(resource.get?.operation.parameters).toEqual([
      { name: 'expand', in: 'query' },
      { name: 'user_id', in: 'path', required: true, description: 'own' },
    ]);
  });

  test('lists operations, skipping those without an operationId', () => {
    const ids = listOperations(shopSpec).map((op) => {
      return op.operation.operationId;
    });
    expect(ids).toContain('getHealth');
    expect(ids).not.toContain('');
    expect(listOperations({})).toEqual([]);
  });
});

describe('references', () => {
  const resources = parseResources({ spec: shopSpec });
  const clients = findResource({ resources, key: 'clients' }) as ApiResource;

  test('finds resources by key and by x-ref name', () => {
    expect(findResource({ resources, key: 'orders' })?.tag).toBe('Orders');
    expect(findResource({ resources, key: 'nope' })).toBeUndefined();
    expect(findResourceByRef({ resources, ref: 'clients' })).toBe(clients);
    expect(findResourceByRef({ resources, ref: 'CLIENTS' })).toBe(clients);
    expect(findResourceByRef({ resources, ref: 'Auth' })?.key).toBe('auth');
    expect(findResourceByRef({ resources, ref: 'nope' })).toBeUndefined();
  });

  test('reads x-ref names', () => {
    expect(getRefName({ 'x-ref': 'clients' })).toBe('clients');
    expect(getRefName({ 'x-ref': '' })).toBeUndefined();
    expect(getRefName({ 'x-ref': 3 } as never)).toBeUndefined();
    expect(getRefName(undefined)).toBeUndefined();
  });

  test('reads record ids and picker options', () => {
    expect(getRecordId({ resource: clients, record: { client_id: 'a' } })).toBe(
      'a'
    );
    expect(getRecordId({ resource: clients, record: { id: 7 } })).toBe('7');
    expect(
      getRecordId({ resource: clients, record: { id: { nested: 1 } } })
    ).toBeUndefined();
    const notes = findResource({ resources, key: 'notes' }) as ApiResource;
    expect(getRecordId({ resource: notes, record: { id: 'n1' } })).toBe('n1');

    expect(
      toRefOption({ resource: clients, record: { id: 'c1', name: 'Ana' } })
    ).toEqual({ value: 'c1', label: 'Ana' });
    expect(toRefOption({ resource: clients, record: { id: 'c1' } })).toEqual({
      value: 'c1',
      label: 'c1',
    });
    expect(
      toRefOption({ resource: clients, record: { name: 'No id' } })
    ).toBeUndefined();
  });

  test('a ref field is a picker; numeric ids are sent as numbers', () => {
    expect(
      getFieldKind({ name: 'client_id', schema: { 'x-ref': 'clients' } })
    ).toBe('ref');
    const field = (type: string) => {
      return {
        name: 'client_id',
        label: 'Client',
        required: false,
        kind: 'ref' as const,
        schema: { type, 'x-ref': 'clients' },
      };
    };
    expect(parseFieldValue({ field: field('integer'), value: '42' })).toEqual({
      ok: true,
      empty: false,
      value: 42,
    });
    expect(parseFieldValue({ field: field('string'), value: 'c1' })).toEqual({
      ok: true,
      empty: false,
      value: 'c1',
    });
  });
});

describe('locations', () => {
  const cases: Array<[OpenApiLocation, string]> = [
    [{ resource: 'clients', view: 'list' }, '/clients'],
    [{ resource: 'clients', view: 'create' }, '/clients/new'],
    [{ resource: 'clients', view: 'detail', id: 'a b' }, '/clients/a%20b'],
    [{ resource: 'clients', view: 'edit', id: 'c1' }, '/clients/c1/edit'],
    [
      { resource: 'clients', view: 'action', action: 'importClients' },
      '/clients/actions/importClients',
    ],
    [
      { resource: 'clients', view: 'action', action: 'sendEmail', id: 'c1' },
      '/clients/c1/actions/sendEmail',
    ],
  ];

  test.each(cases)('%j <-> %s', (location, path) => {
    expect(formatLocation(location)).toBe(path);
    expect(parseLocation(path)).toEqual(location);
  });

  test('ignores query and hash, and rejects other paths', () => {
    expect(parseLocation('/clients/c1?tab=1#top')).toEqual({
      resource: 'clients',
      view: 'detail',
      id: 'c1',
    });
    expect(parseLocation('/')).toBeUndefined();
    expect(parseLocation('/clients/c1/other')).toBeUndefined();
    expect(parseLocation('/clients/c1/x/y')).toBeUndefined();
    expect(parseLocation('/a/b/c/d/e')).toBeUndefined();
  });
});
