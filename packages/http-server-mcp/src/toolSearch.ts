import type { Tool } from './tool';

/** What the deferred `search` ranks: one call, already narrowed to the visible tools. */
export interface ToolSearchArgs {
  /** Free-text query. One without words lists the tools in order. */
  query: string;
  /** Only tools carrying this tag. */
  tag?: string;
  /** Maximum number of tools to return. */
  limit: number;
  /** The tools this request may see. */
  tools: Tool[];
}

const SUMMARY_MAX_LENGTH = 160;
const SUGGESTION_COUNT = 3;
const MIN_RELATED_SCORE = 1;

/** Plural and singular forms rank alike: `agents` finds `get-agent`. */
const stem = (term: string): string => {
  if (term.length > 4 && term.endsWith('ies')) return `${term.slice(0, -3)}y`;
  if (term.length > 3 && term.endsWith('s') && !term.endsWith('ss')) {
    return term.slice(0, -1);
  }
  return term;
};

/** Splits kebab-case, snake_case, camelCase and prose into lowercase terms. */
const termsOf = (text: string): string[] => {
  return text
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => {
      return term.length > 0;
    })
    .map(stem);
};

/** The fields a query term is matched against, most telling first. */
const FIELDS: Array<{ weight: number; text: (tool: Tool) => string }> = [
  {
    weight: 4,
    text: (tool) => {
      return tool.name;
    },
  },
  {
    weight: 3,
    text: (tool) => {
      return tool.summary ?? '';
    },
  },
  {
    weight: 2,
    text: (tool) => {
      return (tool.tags ?? []).join(' ');
    },
  },
  {
    weight: 1,
    text: (tool) => {
      return tool.description;
    },
  },
];

const fieldTerms = new WeakMap<Tool, Array<Set<string>>>();

const termsByField = (tool: Tool): Array<Set<string>> => {
  const cached = fieldTerms.get(tool);
  if (cached) return cached;
  const terms = FIELDS.map((field) => {
    return new Set(termsOf(field.text(tool)));
  });
  fieldTerms.set(tool, terms);
  return terms;
};

/**
 * A term scores the weight of the best field holding it, half that when it
 * is only a prefix of a word there (`proj` → `project`).
 */
const scoreOf = ({ tool, terms }: { tool: Tool; terms: string[] }): number => {
  const fields = termsByField(tool);
  let score = 0;
  for (const term of terms) {
    let best = 0;
    for (const [index, words] of fields.entries()) {
      const weight = FIELDS[index].weight;
      if (words.has(term)) {
        best = Math.max(best, weight);
      } else if (
        term.length >= 3 &&
        [...words].some((word) => {
          return word.startsWith(term);
        })
      ) {
        best = Math.max(best, weight / 2);
      }
    }
    score += best;
  }
  return score;
};

const withTag = ({ tag, tools }: { tag?: string; tools: Tool[] }): Tool[] => {
  return tag === undefined
    ? tools
    : tools.filter((tool) => {
        return tool.tags?.includes(tag) ?? false;
      });
};

/**
 * The tools `query` matches, best first, ties in the tools' order; `undefined`
 * when the query has no words.
 */
const scoreTools = ({
  query,
  tag,
  tools,
}: Omit<ToolSearchArgs, 'limit'>):
  Array<{ tool: Tool; score: number }> | undefined => {
  const terms = [...new Set(termsOf(query))];
  if (terms.length === 0) return undefined;

  return withTag({ tag, tools })
    .map((tool, index) => {
      return { tool, index, score: scoreOf({ tool, terms }) };
    })
    .filter(({ score }) => {
      return score > 0;
    })
    .sort((a, b) => {
      return b.score - a.score || a.index - b.index;
    });
};

/**
 * The deferred tools' default search: scores each tool by the query's terms,
 * weighted name > summary > tags > description, and breaks ties by the
 * tools' order. No index — a few hundred tools need none.
 */
export const rankTools = ({
  query,
  tag,
  limit,
  tools,
}: ToolSearchArgs): Tool[] => {
  const scored = scoreTools({ query, tag, tools });
  if (!scored) return withTag({ tag, tools }).slice(0, limit);

  return scored.slice(0, limit).map(({ tool }) => {
    return tool;
  });
};

export const summaryOf = (tool: Tool): string => {
  const [line] = (tool.summary ?? tool.description).trim().split('\n', 1);
  return line.length > SUMMARY_MAX_LENGTH
    ? `${line.slice(0, SUMMARY_MAX_LENGTH - 1).trimEnd()}…`
    : line;
};

const editDistance = (a: string, b: string): number => {
  const row = Array.from({ length: b.length + 1 }, (_, index) => {
    return index;
  });
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return row[b.length];
};

/** Names a model probably meant: near-misses first, then related tools. */
export const suggestionsFor = ({
  name,
  tools,
}: {
  name: string;
  tools: Tool[];
}): string[] => {
  const tolerance = Math.max(2, Math.floor(name.length / 3));
  const nearMisses = tools
    .map((tool) => {
      return { name: tool.name, distance: editDistance(name, tool.name) };
    })
    .filter(({ distance }) => {
      return distance <= tolerance;
    })
    .sort((a, b) => {
      return a.distance - b.distance;
    })
    .map((candidate) => {
      return candidate.name;
    });
  // Below 1 is a lone prefix in a description, too weak a link to suggest.
  const related = (scoreTools({ query: name, tools }) ?? [])
    .filter(({ score }) => {
      return score >= MIN_RELATED_SCORE;
    })
    .slice(0, SUGGESTION_COUNT)
    .map(({ tool }) => {
      return tool.name;
    });
  return [...new Set([...nearMisses, ...related])].slice(0, SUGGESTION_COUNT);
};
