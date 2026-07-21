import { layerFilterToExpression } from 'src/adapters/maplibre/layerFilter';
import type { LayerFilter } from 'src/spec/types';

describe('layerFilterToExpression', () => {
  test.each<[LayerFilter['operator'], string]>([
    ['eq', '=='],
    ['neq', '!='],
    ['gt', '>'],
    ['gte', '>='],
    ['lt', '<'],
    ['lte', '<='],
  ])("%s compiles to [%s, ['get', property], value]", (operator, symbol) => {
    const filter: LayerFilter = {
      property: 'status',
      operator,
      value: 'active',
    };
    expect(layerFilterToExpression(filter)).toEqual([
      symbol,
      ['get', 'status'],
      'active',
    ]);
  });

  test('in compiles to an [in, [get, property], [literal, value]] expression', () => {
    const filter: LayerFilter = {
      property: 'region',
      operator: 'in',
      value: ['north', 'south'],
    };
    expect(layerFilterToExpression(filter)).toEqual([
      'in',
      ['get', 'region'],
      ['literal', ['north', 'south']],
    ]);
  });

  test('not-in compiles to a negated in expression', () => {
    const filter: LayerFilter = {
      property: 'region',
      operator: 'not-in',
      value: ['north', 'south'],
    };
    expect(layerFilterToExpression(filter)).toEqual([
      '!',
      ['in', ['get', 'region'], ['literal', ['north', 'south']]],
    ]);
  });

  test('works with a numeric value', () => {
    const filter: LayerFilter = {
      property: 'value',
      operator: 'gte',
      value: 100,
    };
    expect(layerFilterToExpression(filter)).toEqual([
      '>=',
      ['get', 'value'],
      100,
    ]);
  });
});
