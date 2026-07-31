import path from 'node:path';

import {
  generateCliRouteManifest,
  operationIdToKebabCommand,
  tagToPascalClassName,
} from 'src/generateCliRoutes';
import { renderCliRoutesSource } from 'src/renderCliRoutesSource';

const specsDir = path.join(__dirname, 'fixtures/cliSpecs');

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
  });
});
