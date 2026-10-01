import { extract } from '@formatjs/cli-lib';
import fg from 'fast-glob';

import {
  ID_INTERPOLATION_PATTERN,
  PRESERVE_WHITESPACE,
  type TranslationData,
} from './config';

/**
 * A marker no author would type, so a generated id can be told apart from an
 * explicit one by extracting the same files a second time.
 */
const GENERATED_ID_MARKER = 'ttoss-i18n-generated:';

export const extractTranslationsFromSource = async ({
  cwd = process.cwd(),
  pattern,
  ignore,
}: {
  cwd?: string;
  pattern: string | string[];
  ignore: string[];
}): Promise<TranslationData> => {
  const files = fg.sync(pattern, { cwd, ignore, absolute: true });

  if (files.length === 0) {
    return {};
  }

  return JSON.parse(
    await extract(files, {
      idInterpolationPattern: ID_INTERPOLATION_PATTERN,
      preserveWhitespace: PRESERVE_WHITESPACE,
    })
  );
};

export type GeneratedIdViolation = {
  id: string;
  defaultMessage?: string;
};

/**
 * Messages in `explicitIds` files that rely on a content-hash id. Those files
 * hold references that are persisted, and a hashed id changes whenever the
 * source text does, orphaning every stored reference.
 */
export const findGeneratedIds = async ({
  cwd = process.cwd(),
  explicitIds,
  ignore,
}: {
  cwd?: string;
  explicitIds: string[];
  ignore: string[];
}): Promise<GeneratedIdViolation[]> => {
  const files = fg.sync(explicitIds, { cwd, ignore, absolute: true });

  if (files.length === 0) {
    return [];
  }

  const extracted: TranslationData = JSON.parse(
    await extract(files, {
      idInterpolationPattern: `${GENERATED_ID_MARKER}${ID_INTERPOLATION_PATTERN}`,
      preserveWhitespace: PRESERVE_WHITESPACE,
    })
  );

  const generated: GeneratedIdViolation[] = [];

  for (const [id, { defaultMessage }] of Object.entries(extracted)) {
    if (id.startsWith(GENERATED_ID_MARKER)) {
      generated.push({
        id: id.slice(GENERATED_ID_MARKER.length),
        defaultMessage,
      });
    }
  }

  return generated;
};

export type DuplicateId = {
  id: string;
  modules: string[];
};

/**
 * Ids declared with different text by the package and a dependency, or by two
 * dependencies. Only one of the texts can win, so the other package renders
 * the wrong message.
 */
export const findDuplicateIds = (
  sources: Array<{ module: string; messages: TranslationData }>
): DuplicateId[] => {
  const seen = new Map<string, { module: string; defaultMessage?: string }>();
  const duplicates = new Map<string, Set<string>>();

  for (const { module, messages } of sources) {
    for (const [id, entry] of Object.entries(messages)) {
      const owner = entry.module ?? module;
      const previous = seen.get(id);

      if (!previous) {
        seen.set(id, { module: owner, defaultMessage: entry.defaultMessage });
        continue;
      }

      if (
        previous.module !== owner &&
        previous.defaultMessage !== entry.defaultMessage
      ) {
        const modules = duplicates.get(id) ?? new Set([previous.module]);
        modules.add(owner);
        duplicates.set(id, modules);
      }
    }
  }

  return [...duplicates].map(([id, modules]) => {
    return { id, modules: [...modules] };
  });
};
