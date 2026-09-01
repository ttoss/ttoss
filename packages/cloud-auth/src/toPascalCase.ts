export const toPascalCase = (name: string) => {
  return name
    .split(/[-_\s]+/)
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
};
