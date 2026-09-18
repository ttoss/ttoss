/** Combining marks left behind by an NFD decomposition. */
const DIACRITICS = /\p{Diacritic}/gu;

/**
 * `text` lowercased with its accents dropped, plus, for every character of the
 * result, the index it came from in `text` — and a final entry for the end.
 *
 * The map is what lets a match found on the folded text be marked on the
 * original: `sao` matches `São Paulo` over three folded characters that are not
 * the same three characters of the label, and only the map says where that run
 * starts and ends in the text actually drawn. Folding one character at a time
 * keeps the two in step even where a character folds to several or to none.
 */
const fold = (text: string) => {
  let folded = '';
  const origin: number[] = [];
  let at = 0;

  for (const char of text) {
    const stripped = char
      .normalize('NFD')
      .replace(DIACRITICS, '')
      .toLowerCase();

    for (let i = 0; i < stripped.length; i += 1) {
      origin.push(at);
    }
    folded += stripped;
    at += char.length;
  }

  // Sentinel, so a run reaching the last character still has an end to read.
  origin.push(text.length);

  return { folded, origin };
};

/**
 * Whether the label holds the query, ignoring case and accents.
 *
 * Accent-insensitive because the names being searched carry accents the person
 * typing mostly will not: a locator over Brazilian municipalities that cannot
 * find `São Paulo` from `sao`, or `Goiânia` from `goiania`, is a locator that
 * fails on its own subject matter.
 *
 * @param params.label - The option's label.
 * @param params.query - What was typed.
 * @returns Whether the option matches.
 *
 * @example
 * matchesQuery({ label: 'São Paulo', query: 'sao' }); // true
 */
export const matchesQuery = ({
  label,
  query,
}: {
  label: string;
  query: string;
}) => {
  return fold(label).folded.includes(fold(query).folded);
};

/**
 * The label split around the matched run: `pre` + `hit` + `post`.
 *
 * Matching is the same accent- and case-insensitive test {@link matchesQuery}
 * filters with, so the highlight can never mark a run the match was not made
 * on, and the three parts always reassemble into the label exactly as written —
 * `São` stays `São` even when it was found by typing `sao`.
 *
 * A query the label does not hold lands everything in `pre`, which renders the
 * label unchanged — the list only ever draws options that matched, so that is a
 * guard rather than a case, and it lives here so it can be held to rather than
 * assumed.
 *
 * @param params.label - The option's label, as it is drawn.
 * @param params.query - The query the option matched.
 * @returns The three runs, in reading order.
 *
 * @example
 * splitMatch({ label: 'São Paulo', query: 'sao' });
 * // { pre: '', hit: 'São', post: ' Paulo' }
 */
export const splitMatch = ({
  label,
  query,
}: {
  label: string;
  query: string;
}) => {
  const { folded, origin } = fold(label);
  const needle = fold(query).folded;

  const at = folded.indexOf(needle);
  if (at < 0) return { pre: label, hit: '', post: '' };

  const start = origin[at];
  const end = origin[at + needle.length];

  return {
    pre: label.slice(0, start),
    hit: label.slice(start, end),
    post: label.slice(end),
  };
};
