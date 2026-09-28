/**
 * Content types set explicitly on uploaded files, keyed by the file's path
 * relative to the build folder.
 *
 * Every other file gets the content type of its extension. A mapping is for
 * the files an extension cannot describe: a media type no extension maps to,
 * such as the `application/linkset+json` RFC 9727 requires of
 * `/.well-known/api-catalog`, or a file with no extension at all.
 */
export type ContentTypes = { [path: string]: string };

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * yargs reads every dot in an option key as nesting, from the command line and
 * from config files alike, so `.well-known/api-catalog` arrives as
 * `{ '': { 'well-known/api-catalog': … } }`. A content type is a string, so a
 * nested object can only be a split path, and joining its keys back on the dot
 * restores the path as written.
 */
const flatten = ({
  prefix,
  record,
}: {
  prefix?: string;
  record: Record<string, unknown>;
}): [string, unknown][] => {
  return Object.entries(record).flatMap(([key, value]) => {
    const path = prefix === undefined ? key : `${prefix}.${key}`;

    return isRecord(value)
      ? flatten({ prefix: path, record: value })
      : [[path, value] as [string, unknown]];
  });
};

export const parseContentTypes = (arg: unknown): ContentTypes => {
  if (arg === undefined || arg === null) {
    return {};
  }

  if (!isRecord(arg)) {
    throw new Error(
      'The content-types option must be an object whose keys are file paths relative to the build folder and values are content types.'
    );
  }

  const contentTypes: ContentTypes = {};

  for (const [key, value] of flatten({ record: arg })) {
    /**
     * A path is written the way its URL reads, so a leading slash names the
     * same object as none.
     */
    const path = key.replace(/^\/+/, '');

    if (!path) {
      throw new Error('The content-types option has an empty path.');
    }

    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(
        `The content type of "${path}" must be a non-empty string.`
      );
    }

    contentTypes[path] = value;
  }

  return contentTypes;
};
