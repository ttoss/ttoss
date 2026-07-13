import type { ThemeTokens } from '../Types';
import { COMPOUND_REF_RE, flattenTheme } from './helpers';

// ---------------------------------------------------------------------------
// DEV-only ref validation
// ---------------------------------------------------------------------------

/**
 * Compute the Levenshtein edit distance between two strings.
 * Used exclusively by `validateRefs` to power "did you mean?" suggestions.
 */
const levenshtein = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => {
    return Array.from({ length: n + 1 }, () => {
      return 0;
    });
  });

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
};

/**
 * Validate that every `{ref}` in the merged theme points to an existing path.
 * Emits `console.warn` for each broken reference with a "did you mean?" suggestion.
 *
 * **DEV-only** — callers gate this behind `process.env.NODE_ENV !== 'production'`
 * so bundlers tree-shake the entire call in production builds.
 */
export const validateRefs = (theme: ThemeTokens): void => {
  const { core, semantic } = flattenTheme(theme);
  const all = { ...core, ...semantic };
  const allKeys = Object.keys(all);

  const findSuggestion = (refPath: string, candidates: string[]): string => {
    if (candidates.length === 0) return '';
    let bestDist = Infinity;
    let bestKey = '';
    for (const candidate of candidates) {
      const dist = levenshtein(refPath, candidate);
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = candidate;
      }
    }
    // Only suggest if reasonably close (less than 40% of the path length)
    if (bestDist <= Math.ceil(refPath.length * 0.4)) {
      return `\n   Did you mean '{${bestKey}}'?`;
    }
    return '';
  };

  for (const [ownerKey, value] of Object.entries(all)) {
    if (typeof value !== 'string' || !value.includes('{')) continue;

    // Match every {ref} in the value (pure refs and compound expressions)
    let match: RegExpExecArray | null;
    const re = new RegExp(COMPOUND_REF_RE.source, COMPOUND_REF_RE.flags);
    while ((match = re.exec(value)) !== null) {
      const refPath = match[1];
      if (all[refPath] !== undefined) continue;

      // Find "did you mean?" suggestion among keys sharing the same top-level prefix
      const prefix = refPath.split('.')[0];
      const candidates = allKeys.filter((k) => {
        return k.startsWith(prefix + '.');
      });
      const suggestion = findSuggestion(refPath, candidates);

      // eslint-disable-next-line no-console
      console.warn(
        `[fsl-theme] Invalid token reference '{${refPath}}' at path '${ownerKey}'.${suggestion}`
      );
    }
  }
};
