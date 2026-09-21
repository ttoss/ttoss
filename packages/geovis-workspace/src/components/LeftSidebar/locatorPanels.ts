/**
 * Which of the three panels under the locator's field the current state draws.
 *
 * One function rather than a condition per panel at the call site, because what
 * matters is that they agree: the results and the "nothing matches" note answer
 * the same question and must never be on screen together, and the recent picks
 * are the empty field's panel, so they have to leave the moment a query starts.
 *
 * @param params.showDrop - Whether the field is open (focused, not escaped).
 * @param params.query - What is typed in the field.
 * @param params.minChars - Characters before the options are searched.
 * @param params.matchCount - How many options the query matched.
 * @param params.recentCount - How many picks have been remembered.
 * @returns Which panels to draw.
 *
 * @example
 * locatorPanels({ showDrop: true, query: 'zz', minChars: 2, matchCount: 0, recentCount: 1 });
 * // { results: false, empty: true, recents: false }
 */
export const locatorPanels = ({
  showDrop,
  query,
  minChars,
  matchCount,
  recentCount,
}: {
  showDrop: boolean;
  query: string;
  minChars: number;
  matchCount: number;
  recentCount: number;
}) => {
  return {
    results: showDrop && matchCount > 0,
    empty: showDrop && query.length >= minChars && matchCount === 0,
    recents: query === '' && recentCount > 0,
  };
};
