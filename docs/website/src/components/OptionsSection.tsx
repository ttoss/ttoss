import * as React from 'react';
import { Text } from '@ttoss/ui';

type Option = {
  alias?: string | string[];
  default?: string | number | boolean;
  describe?: string;
  type: string;
};

const Option = ({
  children,
}: {
  option: string;
  children: React.ReactNode;
}) => {
  return <>{children}</>;
};

export const OptionsSection = ({
  options,
  children,
}: {
  options: Record<string, Option>;
  children?: React.ReactNode;
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

              const optionChild = React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                  if (child.props.option === option) {
                    return child;
                  }
                }

                return null;
              });

              return (
                <tr key={option}>
                  <td>{option}</td>
                  <td>{aliasString}</td>
                  <td>{defaultValue}</td>
                  <td>
                    <Text
                      sx={{
                        fontStyle: 'italic',
                      }}
                    >
                      {describe}
                    </Text>
                    <br />
                    <br />
                    <>{optionChild}</>
                  </td>
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

OptionsSection.Option = Option;
