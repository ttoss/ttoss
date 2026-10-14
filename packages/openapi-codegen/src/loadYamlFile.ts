import fs from 'node:fs';

import { CORE_SCHEMA, load, mergeTag } from 'js-yaml';

/**
 * The YAML 1.2 Core schema (js-yaml 5's default) keeps OpenAPI scalars JSON
 * compatible — `2024-01-02` stays a string — and `mergeTag` keeps anchors with
 * merge keys (`<<: *base`) working as they did with js-yaml 4.
 */
const SCHEMA = CORE_SCHEMA.withTags(mergeTag);

/**
 * Reads and parses a YAML file.
 */
export const loadYamlFile = (filePath: string): unknown => {
  return load(fs.readFileSync(filePath, 'utf8'), {
    filename: filePath,
    schema: SCHEMA,
  });
};
