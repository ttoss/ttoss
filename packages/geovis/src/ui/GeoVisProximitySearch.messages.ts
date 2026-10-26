import { defineMessages } from '@ttoss/react-i18n';

/**
 * The proximity search's texts. `{results}`, `{one}` and `{other}` name what is
 * searched — the spec's `proximitySearch.labels`, or {@link resultOne} and
 * {@link resultOther}.
 */
export const messages = defineMessages({
  searching: {
    defaultMessage: 'Searching {results}…',
    description:
      'Proximity search: shown while the first answer is awaited. "results" names what is searched.',
  },
  widening: {
    defaultMessage: 'Widening the search to {radius}…',
    description:
      'Proximity search: shown while the answer for a wider radius is awaited. "radius" is a distance like "2 km".',
  },
  found: {
    defaultMessage:
      '{count, plural, one {# {one}} other {# {other}}} within {radius}',
    description:
      'Proximity search: how many places were found. "one" and "other" name what is searched, singular and plural; "radius" is a distance like "1 km".',
  },
  foundShort: {
    defaultMessage: '{count} within {radius}',
    description:
      'Proximity search: how many places were found, on a narrow map. "radius" is a distance like "1 km".',
  },
  nothing: {
    defaultMessage: 'Nothing within {radius}',
    description:
      'Proximity search: no place was found. "radius" is a distance like "1 km".',
  },
  clear: {
    defaultMessage: 'Clear search',
    description:
      'Proximity search: label of the buttons that clear the search.',
  },
  radiusGroup: {
    defaultMessage: 'Search radius',
    description: 'Proximity search: accessible name of the radius choice.',
  },
  radiusOption: {
    defaultMessage: 'Radius of {radius}',
    description:
      'Proximity search: tooltip of one radius option. "radius" is a distance like "2 km".',
  },
  fromPoint: {
    defaultMessage: '{distance} from the point',
    description:
      'Proximity search: on a place\'s card, how far it is from the searched point. "distance" is like "450 m" or "1.2 km".',
  },
  resultOne: {
    defaultMessage: 'result',
    description:
      'Proximity search: what a found place is called when the app names it nothing else, singular.',
  },
  resultOther: {
    defaultMessage: 'results',
    description:
      'Proximity search: what found places are called when the app names them nothing else, plural.',
  },
});
