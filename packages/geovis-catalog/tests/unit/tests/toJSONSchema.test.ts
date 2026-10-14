import { toJSONSchema } from 'src/toJSONSchema';
import { z } from 'zod';

describe('toJSONSchema', () => {
  test('keeps a root registered with an id inline, with its meta, and drops it from $defs', () => {
    const point = z.object({ x: z.number() }).meta({ id: 'TestPoint' });
    const shape = z
      .object({ origin: point })
      .meta({ id: 'TestShape', $id: 'https://example.com/shape.json' });

    expect(toJSONSchema(shape)).toEqual({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/shape.json',
      type: 'object',
      properties: { origin: { $ref: '#/$defs/TestPoint' } },
      required: ['origin'],
      additionalProperties: false,
      $defs: {
        TestPoint: {
          type: 'object',
          properties: { x: { type: 'number' } },
          required: ['x'],
          additionalProperties: false,
        },
      },
    });
  });

  test('omits $defs when the root was its only entry', () => {
    const leaf = z.object({ x: z.number() }).meta({ id: 'TestLeaf' });

    const jsonSchema = toJSONSchema(leaf);

    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema).not.toHaveProperty('$ref');
    expect(jsonSchema).not.toHaveProperty('$defs');
  });

  test('keeps the $defs entry of a recursive root, which its inner references need', () => {
    const node: z.ZodType = z
      .object({
        get children() {
          return z.array(node);
        },
      })
      .meta({ id: 'Test/Node~1' });

    const jsonSchema = toJSONSchema(node);

    expect(jsonSchema.type).toBe('object');
    expect(jsonSchema.properties).toEqual({
      children: { type: 'array', items: { $ref: '#/$defs/Test~1Node~01' } },
    });
    expect(jsonSchema.$defs).toHaveProperty(['Test/Node~1']);
  });

  test('returns an id-less root unchanged', () => {
    const plain = z.object({ x: z.number() });

    expect(toJSONSchema(plain)).toEqual(
      z.toJSONSchema(plain, { target: 'draft-2020-12' })
    );
  });
});
