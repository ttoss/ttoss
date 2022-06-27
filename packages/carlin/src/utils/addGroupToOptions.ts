export const addGroupToOptions = <T>(options: T, group: string) => {
  Object.values(options).forEach((option: any) => {
    // eslint-disable-next-line no-param-reassign
    option.group = group;
  });

  return options;
};
