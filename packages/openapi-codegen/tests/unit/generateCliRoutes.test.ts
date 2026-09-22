import path from 'node:path';

import {
  generateCliRouteManifest,
  operationIdToKebabCommand,
  tagToPascalClassName,
  UNKNOWN_FLAG_TYPE,
} from 'src/generateCliRoutes';
import { renderCliRoutesSource } from 'src/renderCliRoutesSource';

const specsDir = path.join(__dirname, 'fixtures/cliSpecs');
const invalidSpecsDir = (name: string) => {
  return path.join(__dirname, 'fixtures/invalidSpecs', name);
};

describe('operationIdToKebabCommand', () => {
  test('converts camelCase to kebab-case', () => {
    expect(operationIdToKebabCommand('listWidgets')).toBe('list-widgets');
    expect(operationIdToKebabCommand('createWidget')).toBe('create-widget');
  });
});

describe('tagToPascalClassName', () => {
  test('converts a tag to a PascalCase class name', () => {
    expect(tagToPascalClassName('Widgets')).toBe('Widgets');
    expect(tagToPascalClassName('AI Providers')).toBe('AIProviders');
  });
});

describe('generateCliRouteManifest', () => {
  const moduleDocsUrl = (moduleSlug: string) => {
    return `https://example.com/docs/modules/${moduleSlug}`;
  };

  test('builds a command per operation, keyed by kebab-case name', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    expect(Object.keys(routes)).toEqual(
      expect.arrayContaining([
        'list-widgets',
        'create-widget',
        'replace-or-create-gadget',
      ])
    );
  });

  test('merges path-level parameters into every operation on that path', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    expect(routes['list-widgets'].pathParams).toEqual(['project_id']);
    expect(routes['list-widgets'].queryParams).toEqual(['page']);
    expect(routes['create-widget'].pathParams).toEqual(['project_id']);
  });

  test('exposes header and cookie parameters alongside path and query ones', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    expect(routes['list-widgets'].headerParams).toEqual(['x_tenant_id']);
    expect(routes['list-widgets'].cookieParams).toEqual(['session']);
    // The header is declared at the path level, so every operation gets it.
    expect(routes['create-widget'].headerParams).toEqual(['x_tenant_id']);
    expect(routes['create-widget'].cookieParams).toEqual([]);
  });

  test('builds a --help flag for header and cookie parameters', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['list-widgets'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    expect(flagsByName.x_tenant_id).toMatchObject({
      required: true,
      in: 'header',
      type: 'string',
      description: 'Tenant the widget belongs to',
    });
    expect(flagsByName.session).toMatchObject({
      required: false,
      in: 'cookie',
      type: 'string',
      description: 'Opaque session cookie',
    });
  });

  test('marks path parameters as required and query parameters per their schema', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['list-widgets'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    expect(flagsByName.project_id).toMatchObject({
      required: true,
      in: 'path',
      type: 'string',
    });
    expect(flagsByName.page).toMatchObject({
      required: false,
      in: 'query',
      type: 'integer',
    });
  });

  test('derives body flags from the requestBody schema', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['create-widget'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    expect(flagsByName.name).toMatchObject({
      required: true,
      in: 'body',
      description: 'Widget name',
    });
    expect(flagsByName.color).toMatchObject({
      required: false,
      in: 'body',
    });
  });

  test('a field is only required when required in every oneOf variant', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['replace-or-create-gadget'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    // `id` is required in only one of the two oneOf variants.
    expect(flagsByName.id).toMatchObject({ required: false, in: 'body' });
    // `name` is required in both variants.
    expect(flagsByName.name).toMatchObject({ required: true, in: 'body' });
  });

  test('sets serviceClass from the operation tag and moduleDocsUrl from the builder', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    expect(routes['list-widgets'].serviceClass).toBe('Widgets');
    expect(routes['list-widgets'].moduleDocsUrl).toBe(
      'https://example.com/docs/modules/widgets'
    );
    expect(routes['replace-or-create-gadget'].serviceClass).toBe('Gadgets');
  });

  test('falls back from description to summary to operationId', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    expect(routes['list-widgets'].description).toBe('List widgets');
    expect(routes['create-widget'].description).toBe('Create a new widget');
  });

  test('skips operations with no tag and no module-level tag', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    expect(routes['get-untagged']).toBeUndefined();
  });

  test('resolves a $ref path-level parameter against components.parameters', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    expect(routes['create-from-ref'].pathParams).toEqual(['item_id']);
    const itemIdFlag = routes['create-from-ref'].flags.find((flag) => {
      return flag.name === 'item_id';
    });
    expect(itemIdFlag).toMatchObject({ required: true, in: 'path' });
  });

  test('resolves a requestBody schema that is itself a $ref, including a nested $ref property', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['create-from-ref'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    expect(flagsByName.name).toMatchObject({
      required: true,
      in: 'body',
      description: 'Name of the item',
    });
    expect(flagsByName.extra).toMatchObject({
      required: false,
      in: 'body',
      type: 'string',
      description: 'Extra info resolved via nested $ref',
    });
  });

  test('types an untyped or union schema `unknown` rather than guessing `string`', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['create-template'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    // `oneOf: [<an object>, string]` behind a $ref: the flag admits both
    // shapes, so a consumer must JSON-parse it instead of sending text.
    expect(flagsByName.template).toMatchObject({
      required: true,
      in: 'body',
      type: UNKNOWN_FLAG_TYPE,
      description: 'A template object, or the YAML text of one',
    });
    // A property with no `type` at all is unconstrained, not a string.
    expect(flagsByName.labels).toMatchObject({ type: UNKNOWN_FLAG_TYPE });
    // A union that refers back to itself terminates instead of recursing.
    expect(flagsByName.related).toMatchObject({ type: UNKNOWN_FLAG_TYPE });
    // A parameter with no schema at all is unconstrained too.
    expect(flagsByName.tenant).toMatchObject({
      in: 'query',
      type: UNKNOWN_FLAG_TYPE,
    });
  });

  test('types a schema from its $ref chain and composition members', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['create-template'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    // `allOf` is an intersection: the member that names a type names the schema.
    expect(flagsByName.spec).toMatchObject({ type: 'object' });
    // A $ref to a schema that is itself a $ref resolves to the end of the chain.
    expect(flagsByName.alias).toMatchObject({ type: 'string' });
    // Every member of the union is a string, so the flag is one too.
    expect(flagsByName.format).toMatchObject({ in: 'query', type: 'string' });
  });

  test('merges the properties of a requestBody `oneOf` whose variants are $refs', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['import-template'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    expect(flagsByName.url).toMatchObject({
      required: false,
      in: 'body',
      type: 'string',
      description: 'Where to fetch the template from',
    });
    expect(flagsByName.body).toMatchObject({ required: false, in: 'body' });
    // `format` is the one field both variants require.
    expect(flagsByName.format).toMatchObject({ required: true, in: 'body' });
  });

  test('throws on a schema $ref naming a file that is not there', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('unresolvedSchemaRef'),
        moduleDocsUrl,
      });
    }).toThrow(/cannot resolve schema \$ref ".\/shared.yaml/);
  });

  test('throws on a body property $ref it cannot resolve instead of typing it `string`', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('unresolvedPropertyRef'),
        moduleDocsUrl,
      });
    }).toThrow(
      /cannot resolve schema \$ref "#\/components\/schemas\/Metadata"/
    );
  });

  test('throws on a $ref cycle instead of following it forever', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('circularSchemaRef'),
        moduleDocsUrl,
      });
    }).toThrow(/is part of a \$ref cycle/);
  });

  test('throws on a parameter $ref naming a file that is not there', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('unresolvedParamRef'),
        moduleDocsUrl,
      });
    }).toThrow(/cannot resolve parameter \$ref/);
  });

  test('throws on a parameter with an unknown `in` instead of dropping it', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('unknownParamLocation'),
        moduleDocsUrl,
      });
    }).toThrow(/parameter "page" declares `in: formData`/);
  });

  test('resolves a parameter and a schema $ref into another file', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const route = routes['create-catalog-item'];
    const flagsByName = Object.fromEntries(
      route.flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    // The parameter lives in `common.yaml`, and the schema typing it lives in
    // a third file that `common.yaml` — not `catalog.yaml` — points at.
    expect(route.headerParams).toEqual(['tenant_id']);
    expect(flagsByName.tenant_id).toMatchObject({
      required: true,
      in: 'header',
      type: 'string',
      description: 'Tenant the request belongs to',
    });
    // A parameter that is a $ref to a parameter in a further file.
    expect(route.queryParams).toEqual(['region']);
    expect(flagsByName.region).toMatchObject({
      required: false,
      in: 'query',
      type: 'string',
      description: 'Region the request is served from',
    });
  });

  test('resolves a body property $ref into another file, and through it', () => {
    const routes = generateCliRouteManifest({ specsDir, moduleDocsUrl });

    const flagsByName = Object.fromEntries(
      routes['create-catalog-item'].flags.map((flag) => {
        return [flag.name, flag];
      })
    );

    // `Label` is a $ref in `common.yaml` to a schema in `primitives.yaml`:
    // the second hop is relative to the file that wrote it, not to `catalog.yaml`.
    expect(flagsByName.name).toMatchObject({
      required: true,
      in: 'body',
      type: 'string',
      description: 'A short string',
    });
    // A union in the shared file is typed there, exactly as a local one is.
    expect(flagsByName.metadata).toMatchObject({
      required: false,
      in: 'body',
      type: UNKNOWN_FLAG_TYPE,
      description: 'Arbitrary metadata, an object or the JSON text of one',
    });
    // A ref into a sibling module's own components.
    expect(flagsByName.widget).toMatchObject({
      in: 'body',
      type: 'string',
      description: 'Id of an existing widget',
    });
    // And one into a file outside `specsDir` entirely.
    expect(flagsByName.currency).toMatchObject({
      in: 'body',
      type: 'string',
      description: 'ISO 4217 currency code',
    });
  });

  test('throws when the file a $ref names has no such component', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('missingSharedComponent'),
        moduleDocsUrl,
      });
    }).toThrow(/declares no `components\.schemas\.Missing`/);
  });

  test('throws on a $ref into a remote document', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('remoteSchemaRef'),
        moduleDocsUrl,
      });
    }).toThrow(/Refs into a remote document are not supported/);
  });

  test('throws on a $ref that points outside `components`', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('badRefPointer'),
        moduleDocsUrl,
      });
    }).toThrow(/Expected a ref into `components\.schemas`/);
  });

  test('throws on a $ref naming a whole file rather than a component in it', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('wholeFileRef'),
        moduleDocsUrl,
      });
    }).toThrow(/Expected a ref into `components\.schemas`/);
  });

  test('throws on a parameter $ref cycle instead of following it forever', () => {
    expect(() => {
      return generateCliRouteManifest({
        specsDir: invalidSpecsDir('circularParamRef'),
        moduleDocsUrl,
      });
    }).toThrow(/parameter \$ref .* is part of a \$ref cycle/);
  });

  test('supports overriding the command and class naming functions', () => {
    const routes = generateCliRouteManifest({
      specsDir,
      moduleDocsUrl,
      operationIdToCommand: (operationId) => {
        return operationId.toLowerCase();
      },
      tagToClassName: (tag) => {
        return tag.toUpperCase();
      },
    });

    expect(routes.listwidgets).toBeDefined();
    expect(routes.listwidgets.serviceClass).toBe('WIDGETS');
  });
});

describe('renderCliRoutesSource', () => {
  test('renders a TypeScript module exporting the route manifest', () => {
    const routes = generateCliRouteManifest({
      specsDir,
      moduleDocsUrl: (moduleSlug) => {
        return `https://example.com/docs/modules/${moduleSlug}`;
      },
    });

    const source = renderCliRoutesSource(routes);

    expect(source).toContain('export interface Route {');
    expect(source).toContain('export interface Flag {');
    expect(source).toContain('export const routes: Record<string, Route> = {');
    expect(source).toContain("'list-widgets': { serviceClass: 'Widgets'");
    expect(source).toContain("operationId: 'createWidget'");
    expect(source).toContain(
      "  in: 'path' | 'query' | 'header' | 'cookie' | 'body';"
    );
    expect(source).toContain('headerParams: ["x_tenant_id"]');
    expect(source).toContain('cookieParams: ["session"]');
  });
});
