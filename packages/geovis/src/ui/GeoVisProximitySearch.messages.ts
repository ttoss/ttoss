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
  closeCard: {
    defaultMessage: 'Close',
    description:
      "Proximity search: label of the button that closes a place's card.",
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
  searchingNearYou: {
    defaultMessage: 'Searching {results} near you…',
    description:
      'Proximity search from the reader\'s location: shown while the first answer is awaited. "results" names what is searched.',
  },
  foundNearYou: {
    defaultMessage:
      '{count, plural, one {# {one}} other {# {other}}} within {radius} of you',
    description:
      'Proximity search from the reader\'s location: how many places were found. "one" and "other" name what is searched, singular and plural; "radius" is a distance like "1 km".',
  },
  you: {
    defaultMessage: 'You',
    description:
      "Proximity search: the tag over the dot marking the reader's location.",
  },
  youClear: {
    defaultMessage: 'You are here · clear search',
    description:
      "Proximity search: tooltip of the dot marking the reader's location, which clears the search when clicked.",
  },
  locate: {
    defaultMessage: '{results} near me',
    description:
      'Proximity search: tooltip of the button that searches from the reader\'s location. "results" names what is searched, plural, e.g. "services near me".',
  },
  locateLabel: {
    defaultMessage: 'Search {results} near my location',
    description:
      'Proximity search: accessible name of the button that searches from the reader\'s location. "results" names what is searched, plural.',
  },
  locating: {
    defaultMessage: 'Getting your location…',
    description:
      "Proximity search: shown while the browser looks up the reader's location.",
  },
  askTitle: {
    defaultMessage: 'Use your location?',
    description:
      "Proximity search: title of the dialog shown before the browser asks for the reader's location.",
  },
  askBody: {
    defaultMessage:
      'To show the {results} around you, the map needs your current location. Your browser will ask you to confirm next.',
    description:
      'Proximity search: why the reader\'s location is needed, before the browser asks for it. "results" names what is searched, plural.',
  },
  privacy: {
    defaultMessage:
      'Your location is used only for this search. It is neither saved nor shared.',
    description:
      "Proximity search: privacy note in the dialog asking for the reader's location.",
  },
  notNow: {
    defaultMessage: 'Not now',
    description:
      "Proximity search: button that closes the dialog asking for the reader's location.",
  },
  allow: {
    defaultMessage: 'Allow access',
    description:
      "Proximity search: button that goes on to the browser's request for the reader's location.",
  },
  deniedTitle: {
    defaultMessage: "We couldn't get your location",
    description:
      "Proximity search: title of the dialog shown when the reader's location could not be had.",
  },
  deniedBody: {
    defaultMessage:
      'Permission was denied or no signal was found. Turn location on in your browser settings and try again — or click a pin on the map to search from it.',
    description:
      "Proximity search: what to do when the reader's location could not be had.",
  },
  usePin: {
    defaultMessage: 'Use a pin',
    description:
      'Proximity search: button that closes the location error dialog, so the reader searches from a pin instead.',
  },
  retry: {
    defaultMessage: 'Try again',
    description:
      "Proximity search: button that asks the browser for the reader's location again.",
  },
});
