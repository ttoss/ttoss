import type { FlexProps } from '@ttoss/ui';
import { Flex } from '@ttoss/ui';
import type * as React from 'react';

const alignMap = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
} as const;

/**
 * Props for the FormActions component.
 */
export type FormActionsProps = {
  /** Action buttons (Submit, Cancel, Reset, etc.). */
  children: React.ReactNode;
  /**
   * Horizontal alignment of the action buttons.
   * @default 'right'
   */
  align?: keyof typeof alignMap;
  /**
   * When `true`, the action bar sticks to the bottom of the viewport so it
   * remains visible while the user scrolls through a long form.
   * @default false
   */
  sticky?: boolean;
} & Omit<FlexProps, 'children'>;

/**
 * FormActions is a layout container for form action buttons such as Submit,
 * Cancel, and Reset. It renders a flex row with consistent spacing.
 *
 * Use `align` to control horizontal button placement (`'left'`, `'center'`,
 * or `'right'`). Use `sticky` to keep the action bar visible while the user
 * scrolls through a long form.
 *
 * @example
 * ```tsx
 * <Form.Actions align="right" sticky>
 *   <Button variant="secondary" onClick={onCancel}>Cancel</Button>
 *   <Button type="submit">Save</Button>
 * </Form.Actions>
 * ```
 */
export const FormActions = ({
  align = 'right',
  children,
  sticky = false,
  sx,
  ...flexProps
}: FormActionsProps) => {
  return (
    <Flex
      {...flexProps}
      sx={{
        flexDirection: 'row',
        gap: '2',
        justifyContent: alignMap[align],
        marginTop: '4',
        ...(sticky && {
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'background',
          paddingY: '3',
          zIndex: 'sticky',
        }),
        ...sx,
      }}
    >
      {children}
    </Flex>
  );
};
