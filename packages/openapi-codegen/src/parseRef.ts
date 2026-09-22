import path from 'node:path';

/** A `$ref` naming a document to fetch over the network rather than a file. */
const REMOTE_REF = /^[a-z][a-z\d+.-]*:\/\//i;

/**
 * Splits a `$ref` into the document it names and the pointer into it. A ref
 * with no file part is same-file; a file part is resolved against the
 * directory of the spec that wrote it, so a shared components file can point
 * at a third file of its own and be read from wherever it is referenced.
 */
export const parseRef = (args: {
  ref: string;
  fromSpecPath: string;
}): { pointer: string; remote: boolean; specPath: string } => {
  const { ref, fromSpecPath } = args;
  const [filePart, pointer = ''] = ref.split('#');

  return {
    pointer,
    remote: Boolean(filePart && REMOTE_REF.test(filePart)),
    specPath: filePart
      ? path.resolve(path.dirname(fromSpecPath), filePart)
      : fromSpecPath,
  };
};
