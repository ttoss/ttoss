import { Icon } from '@ttoss/react-icons';
import type { ButtonProps } from '@ttoss/ui';
import { Button, Card, Flex } from '@ttoss/ui';
import type * as React from 'react';

import { Modal } from '../Modal';
import { SpotlightCard } from '../SpotlightCard';

type LockedModalAction = {
  /**
   * Label text for the button
   */
  label: string;
  /**
   * Icon identifier from @ttoss/react-icons
   */
  icon?: string;
  /**
   * Button variant
   */
  variant: 'primary' | 'accent' | 'secondary';
  /**
   * Click handler for the button
   */
  onClick: () => void;
};

type LockedModalProps = {
  /**
   * Controls the modal visibility
   */
  isOpen: boolean;
  /**
   * Optional close handler. If not provided, modal cannot be closed by user interaction
   */
  onRequestClose?: () => void;
  /**
   * Header configuration for the SpotlightCard
   */
  header: {
    /**
     * Icon identifier from @ttoss/react-icons
     */
    icon: string;
    /**
     * Title text for the header
     */
    title: string;
    /**
     * Description text for the header
     */
    description: string;
    /**
     * Visual variant for the SpotlightCard
     * @default 'primary'
     */
    variant?: 'primary' | 'accent';
  };
  /**
   * Optional first button to display in the SpotlightCard header
   */
  firstButton?: ButtonProps | React.ReactNode;
  /**
   * Optional second button to display in the SpotlightCard header
   */
  secondButton?: ButtonProps | React.ReactNode;
  /**
   * Content to be rendered in the modal body
   */
  children: React.ReactNode;
  /**
   * Optional list of actions to render as buttons in the footer
   */
  actions?: LockedModalAction[];
  /**
   * Optional style prop for the modal overlay and content
   */
  style?: {
    overlay?: React.CSSProperties;
    content?: React.CSSProperties;
  };
  /**
   * Optional z-index value to control modal stacking order.
   * Useful when using modal inside layouts like SidebarCollapseLayout
   * to prevent it from covering header/sidebar elements.
   * @default 'modal' (theme value)
   *
   * zIndex hierarchy reference:
   * - modal: 1400
   * - overlay: 1300 (sidebar layouts use this value to stay below header/sidebar)
   * - dropdown: 1000
   * - sticky: 1100
   * - banner: 1200
   */
  zIndex?: string | number;
};

/**
 * LockedModal is a generic modal component for displaying locked features or restricted content.
 *
 * This component provides a consistent UI for showing users content that requires
 * additional permissions, plan upgrades, or other conditions to access.
 *
 * @example
 * ```tsx
 * <LockedModal
 *   isOpen={isOpen}
 *   onRequestClose={() => setIsOpen(false)}
 *   header={{
 *     icon: "fluent:lock-closed-24-filled",
 *     title: "Premium Feature",
 *     description: "Available in Pro plan only",
 *     variant: "primary"
 *   }}
 *   actions={[
 *     {
 *       label: "Upgrade Now",
 *       icon: "fluent-emoji-high-contrast:sparkles",
 *       variant: "primary",
 *       onClick: handleUpgrade
 *     },
 *     {
 *       label: "Learn More",
 *       icon: "fluent:arrow-right-16-regular",
 *       variant: "accent",
 *       onClick: handleLearnMore
 *     }
 *   ]}
 * >
 *   <Text>This feature is only available for Pro users.</Text>
 * </LockedModal>
 * ```
 *
 * @example
 * ```tsx
 * // Using inside SidebarCollapseLayout - modal won't cover header/sidebar
 * <LockedModal
 *   isOpen={isOpen}
 *   zIndex={1}
 *   header={{
 *     icon: "fluent:lock-closed-24-filled",
 *     title: "Feature Locked",
 *     description: "Unlock this feature"
 *   }}
 * >
 *   <Text>Content here</Text>
 * </LockedModal>
 * ```
 */
export const LockedModal = ({
  isOpen,
  onRequestClose,
  header,
  firstButton,
  secondButton,
  children,
  actions,
  style,
  zIndex,
}: LockedModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={
        onRequestClose ||
        (() => {
          return undefined;
        })
      }
      appElement={
        (document.getElementById('root') as HTMLElement) || document.body
      }
      style={{
        overlay: {
          zIndex,
          ...style?.overlay,
        },
        content: { ...style?.content },
      }}
    >
      <Card
        className="lockedmodal-card"
        sx={{
          width: 'full',
          maxWidth: '620px',
          borderRadius: 'lg',
          overflow: 'hidden',
          border: 'none',
          boxShadow: 'none',
        }}
      >
        <Flex sx={{ width: 'full', paddingX: '6', paddingY: '4' }}>
          {/** TODO: SpotlightCard firstButton and secondButton props
           * but, in the moment the style of SpotlightCard is not responsive when width is reduced
           * so the buttons may break the layout */}
          <SpotlightCard
            icon={header.icon}
            title={header.title}
            description={header.description}
            variant={header.variant || 'primary'}
            firstButton={firstButton}
            secondButton={secondButton}
          />
        </Flex>

        <Card.Body
          sx={{ px: ['5', '7'], py: ['6', '7'], gap: '6', width: 'full' }}
        >
          {children}

          {actions && actions.length > 0 && (
            <Card.Footer>
              <Flex
                className="lockedmodal-footer"
                sx={{
                  flexDirection: 'column',
                  gap: '4',
                  alignItems: 'center',
                  width: 'full',
                  paddingX: '6',
                  marginTop: '8',
                }}
              >
                {actions.map((action, index) => {
                  return (
                    <Button
                      key={index}
                      variant={action.variant}
                      onClick={action.onClick}
                      sx={{ width: 'full', justifyContent: 'center' }}
                    >
                      {action.icon && <Icon icon={action.icon} />}
                      {action.label}
                    </Button>
                  );
                })}
              </Flex>
            </Card.Footer>
          )}
        </Card.Body>
      </Card>
    </Modal>
  );
};
