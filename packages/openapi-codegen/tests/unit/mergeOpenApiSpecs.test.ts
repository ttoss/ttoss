import path from 'node:path';

import { mergeOpenApiSpecs } from 'src/mergeOpenApiSpecs';

const specsDir = path.join(__dirname, 'fixtures/mergeSpecs');

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
