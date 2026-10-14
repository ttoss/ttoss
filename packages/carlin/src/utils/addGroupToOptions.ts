export const addGroupToOptions = <T extends Record<string, unknown>>(
  options: T,
  group: string
) => {
  for (const option of Object.values(options)) {
    (option as { group?: string }).group = group;
  }

  return options;
};
