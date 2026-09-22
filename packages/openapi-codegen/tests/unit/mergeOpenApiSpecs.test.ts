import path from 'node:path';

import { mergeOpenApiSpecs } from 'src/mergeOpenApiSpecs';

const specsDir = path.join(__dirname, 'fixtures/mergeSpecs');
const invalidSpecsDir = (name: string) => {
  return path.join(__dirname, 'fixtures/invalidMergeSpecs', name);
};

describe('mergeOpenApiSpecs', () => {
  test('combines paths from every spec file', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    expect(Object.keys(merged.paths ?? {})).toEqual(
      expect.arrayContaining(['/widgets', '/gadgets'])
    );
  });

  test('combines components.schemas from every spec file', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    expect(Object.keys(merged.components?.schemas ?? {})).toEqual(
      expect.arrayContaining(['Widget', 'Gadget'])
    );
  });

  test('combines components.responses, securitySchemes, and parameters', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    expect(merged.components?.responses?.WidgetList).toBeDefined();
    expect(merged.components?.securitySchemes?.bearerAuth).toBeDefined();
    expect(merged.components?.parameters?.ProjectId).toBeDefined();
  });

  test('first file wins on a components.schemas name collision', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    const widget = merged.components?.schemas?.Widget as {
      properties: Record<string, unknown>;
    };

    // a-widgets.yaml (sorted first) defines `id`; c-conflicting.yaml
    // (sorted last) redefines Widget with `conflictingField` — the merge
    // must keep the first file's definition.
    expect(widget.properties).toHaveProperty('id');
    expect(widget.properties).not.toHaveProperty('conflictingField');
  });

  test('keeps the first non-empty servers array found', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    expect(merged.servers).toEqual([{ url: 'https://api.example.com' }]);
  });

  test('rewrites cross-file $refs to local refs', () => {
    const merged = mergeOpenApiSpecs({ specsDir });
    const serialized = JSON.stringify(merged);

    expect(serialized).not.toMatch(/\.ya?ml#/);
    expect(serialized).toContain('"$ref":"#/components/schemas/Widget"');
    expect(serialized).toContain('"$ref":"#/components/parameters/ProjectId"');
  });

  test('pulls in a component from a file outside specsDir', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    // `Catalog` and `CatalogId` live in ../mergeShared/catalog.yaml, which is
    // referenced by b-gadgets.yaml but is not a spec file itself.
    expect(merged.components?.schemas?.Catalog).toBeDefined();
    expect(merged.components?.parameters?.CatalogId).toBeDefined();
  });

  test('follows what a pulled component refs in turn', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    // `Catalog` refs `CatalogEntry` in its own file, which refs `Label` in a
    // third file — read relative to the file that wrote the ref.
    expect(merged.components?.schemas?.CatalogEntry).toBeDefined();
    expect(merged.components?.schemas?.Label).toEqual({ type: 'string' });
  });

  test('leaves a same-file ref the merged document answers alone', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    // b-gadgets.yaml refs `#/components/schemas/Widget`, which a-widgets.yaml
    // declares: nothing to pull, and nothing to complain about.
    const gadget = merged.components?.schemas?.Gadget as {
      properties: Record<string, unknown>;
    };

    expect(gadget.properties.widget).toEqual({
      $ref: '#/components/schemas/Widget',
    });
  });

  test('leaves a same-file ref into a section it does not merge alone', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    // a-widgets.yaml refs `#/components/requestBodies/CreateWidget`, a
    // section this merge does not carry: nothing to pull, nothing to reject.
    const widgets = merged.paths?.['/widgets'] as {
      post: { requestBody: unknown };
    };

    expect(widgets.post.requestBody).toEqual({
      $ref: '#/components/requestBodies/CreateWidget',
    });
  });

  test('throws on a cross-file $ref naming a file that is not there', () => {
    expect(() => {
      return mergeOpenApiSpecs({ specsDir: invalidSpecsDir('missingFile') });
    }).toThrow(/cannot pull \$ref ".\/shared\.yaml#.*No such file/s);
  });

  test('throws when the file a cross-file $ref names has no such component', () => {
    expect(() => {
      return mergeOpenApiSpecs({
        specsDir: invalidSpecsDir('missingComponent'),
      });
    }).toThrow(/declares no `components\.schemas\.Missing`/);
  });

  test('throws on a $ref into a remote document', () => {
    expect(() => {
      return mergeOpenApiSpecs({ specsDir: invalidSpecsDir('remoteRef') });
    }).toThrow(/Refs into a remote document are not supported/);
  });

  test('throws on a cross-file $ref into a section it cannot pull', () => {
    expect(() => {
      return mergeOpenApiSpecs({
        specsDir: invalidSpecsDir('unsupportedSection'),
      });
    }).toThrow(/Expected a ref into one of: `components\.schemas`/);
  });

  test('throws when a pulled component collides with a different definition', () => {
    expect(() => {
      return mergeOpenApiSpecs({ specsDir: invalidSpecsDir('collidingPull') });
    }).toThrow(/already holds a different definition of that name/s);
  });

  test('stamps the requested openapi version and info', () => {
    const merged = mergeOpenApiSpecs({
      specsDir,
      openapiVersion: '3.1.0',
      info: { title: 'Example API', version: '1.0.0' },
    });

    expect(merged.openapi).toBe('3.1.0');
    expect(merged.info).toEqual({ title: 'Example API', version: '1.0.0' });
  });

  test('omits info when not provided', () => {
    const merged = mergeOpenApiSpecs({ specsDir });

    expect(merged.info).toBeUndefined();
  });
});
