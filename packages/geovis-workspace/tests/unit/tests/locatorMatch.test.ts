/**
 * The locator's matching, on its own: accent folding, and the map that carries
 * a match found on folded text back onto the label as written. The miss is
 * unreachable through the control — the list only draws options that matched —
 * so it is held to here instead.
 */

import {
  matchesQuery,
  splitMatch,
} from 'src/components/LeftSidebar/locatorMatch';

test('matching ignores case and accents in both directions', () => {
  expect(matchesQuery({ label: 'São Paulo', query: 'sao' })).toBe(true);
  expect(matchesQuery({ label: 'Goiânia', query: 'GOIANIA' })).toBe(true);
  expect(matchesQuery({ label: 'Santos', query: 'sãn' })).toBe(true);
  expect(matchesQuery({ label: 'Santos', query: 'recife' })).toBe(false);
});

test('the matched run is split out of the label, whatever its case', () => {
  expect(splitMatch({ label: 'Santos', query: 'san' })).toEqual({
    pre: '',
    hit: 'San',
    post: 'tos',
  });

  expect(splitMatch({ label: 'Santo André', query: 'andre' })).toEqual({
    pre: 'Santo ',
    hit: 'André',
    post: '',
  });
});

/*
 * The run is marked on the label as written: a match made on `sao` still draws
 * `São`, because the fold carries the index each folded character came from.
 */
test('an accented label keeps its accents in all three runs', () => {
  expect(splitMatch({ label: 'São Paulo', query: 'sao' })).toEqual({
    pre: '',
    hit: 'São',
    post: ' Paulo',
  });

  expect(splitMatch({ label: 'Goiânia', query: 'ania' })).toEqual({
    pre: 'Goi',
    hit: 'ânia',
    post: '',
  });

  expect(splitMatch({ label: 'Florianópolis', query: 'anop' })).toEqual({
    pre: 'Flori',
    hit: 'anóp',
    post: 'olis',
  });
});

test('a query the label does not hold leaves the label whole', () => {
  expect(splitMatch({ label: 'Santos', query: 'recife' })).toEqual({
    pre: 'Santos',
    hit: '',
    post: '',
  });
});

test('an empty query marks nothing', () => {
  expect(splitMatch({ label: 'São Paulo', query: '' })).toEqual({
    pre: '',
    hit: '',
    post: 'São Paulo',
  });
});
