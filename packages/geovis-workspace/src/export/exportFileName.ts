/**
 * Folds a label into a file-name slug: accents dropped, lower-cased, and every
 * run of anything else collapsed to a single hyphen.
 *
 * @param text - The label to fold.
 * @returns The slug; empty when nothing alphanumeric is left.
 *
 * @example
 * slugify('Taxa cumulativa (% do total)'); // 'taxa-cumulativa-do-total'
 */
export const slugify = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * The file name the export dialog suggests: the map's title as a slug, then the
 * timeline's value when there is one — `taxa-cumulativa_2024`. Falls back to
 * `mapa` when the title folds to nothing, so the field never opens empty.
 *
 * @param params.title - The title drawn on the image.
 * @param params.year - The timeline's current value, if any.
 * @returns The suggested base name, without extension.
 *
 * @example
 * suggestFileName({ title: 'Cozinhas', year: 2024 }); // 'cozinhas_2024'
 */
export const suggestFileName = ({
  title,
  year,
}: {
  title?: string;
  year?: number;
}): string => {
  const base = slugify(title ?? '') || 'mapa';

  return year === undefined ? base : `${base}_${year}`;
};

/**
 * Cleans what the reader typed into the file-name field: a trailing `.png` is
 * dropped (the dialog adds it) and characters no file system accepts are
 * removed rather than rejected, so typing never fights the field.
 *
 * @param input - The raw field value.
 * @returns The cleaned base name.
 *
 * @example
 * sanitizeFileName('mapa:final.png'); // 'mapafinal'
 */
export const sanitizeFileName = (input: string): string => {
  return input.replace(/\.png$/i, '').replace(/[\\/:*?"<>|]/g, '');
};
