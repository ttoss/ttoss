type Option = {
  alias?: string | string[];
  default?: string | number | boolean;
  describe?: string;
  type: string;
};

export const OptionsTable = ({
  options,
}: {
  options: Record<string, Option>;
}) => {
  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Alias</th>
            <th>Default</th>
            <th>Description</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(options).map(
            ([option, { alias, default: defaultValue, describe, type }]) => {
              const aliasString = Array.isArray(alias)
                ? alias.join(', ')
                : alias;
              return (
                <tr key={option}>
                  <td>{option}</td>
                  <td>{aliasString}</td>
                  <td>{defaultValue}</td>
                  <td>{describe}</td>
                  <td>{type}</td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
};
