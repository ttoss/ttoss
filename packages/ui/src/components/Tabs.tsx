import { Tabs as ChakraTabs } from '@chakra-ui/react';
import { Icon, IconType } from '@ttoss/react-icons';
import * as React from 'react';

export const Tabs = ({
  rootValue,
  variant,
  triggerList,
  triggerContentList,
}: {
  rootValue: string;
  variant: 'outline' | 'line' | 'subtle' | 'enclosed' | 'plain' | undefined;
  triggerList: {
    value: string;
    leftIcon?: IconType;
    name: string;
    disabled?: boolean;
  }[];
  triggerContentList: { value: string; content: React.ReactNode }[];
}) => {
  return (
    <ChakraTabs.Root defaultValue={rootValue} variant={variant}>
      <ChakraTabs.List>
        {triggerList.map((trigger) => {
          return (
            <ChakraTabs.Trigger
              value={trigger.value}
              key={trigger.value}
              disabled={trigger.disabled}
            >
              {trigger.leftIcon && <Icon icon={trigger.leftIcon} />}
              {trigger.name}
            </ChakraTabs.Trigger>
          );
        })}
      </ChakraTabs.List>
      {triggerContentList.map((content) => {
        return (
          <ChakraTabs.Content value={content.value} key={content.value}>
            {content.content}
          </ChakraTabs.Content>
        );
      })}
    </ChakraTabs.Root>
  );
};
