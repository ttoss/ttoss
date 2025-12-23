import { Icon } from '@ttoss/react-icons';
import type { ButtonProps, Theme, ThemeUIStyleObject } from '@ttoss/ui';
import { Button, Card, Flex } from '@ttoss/ui';
import type * as React from 'react';

import { SpotlightCard } from '../SpotlightCard';

type LockedOverlayAction = {
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

type LockedOverlayProps = {
  /**
   * Controls the overlay visibility
   */
  isOpen: boolean;
  /**
   * Optional close handler. If not provided, overlay cannot be closed by user interaction
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
   * Content to be rendered in the overlay body
   */
  children: React.ReactNode;
  /**
   * Optional list of actions to render as buttons in the footer
   */
  actions?: LockedOverlayAction[];
  /**
   * Optional style overrides for the overlay and content container
   */
  sx?: ThemeUIStyleObject<Theme<object>>;
  /**
   * Optional z-index value to control overlay stacking order.
   * The overlay will appear above the parent container content.
   * @default 1
   *
   * zIndex hierarchy reference:
   * - modal: 1400
   * - overlay: 1300 (sidebar layouts use this value)
   * - dropdown: 1000
   * - sticky: 1100
   * - banner: 1200
   */
  zIndex?: string | number;
};

/**
 * LockedOverlay is a component for blocking and displaying locked features or restricted content
 * within a specific container.
 *
 * This component renders as an absolutely positioned overlay that blocks the parent container's content.
 * The parent container must have `position: relative` for proper positioning.
 *
 * Unlike a modal, this component blocks only its parent container, not the entire viewport,
 * making it ideal for blocking specific sections like Layout.Main, Layout.Main.Body, etc.
 *
 * @example
 * ```tsx
 * // Parent container must have position: relative
 * <Layout.Main sx={{ position: 'relative' }}>
 *   <LockedOverlay
 *     isOpen={isOpen}
 *     onRequestClose={() => setIsOpen(false)}
 *     header={{
 *       icon: "fluent:lock-closed-24-filled",
 *       title: "Premium Feature",
 *       description: "Available in Pro plan only",
 *       variant: "primary"
 *     }}
 *     actions={[
 *       {
 *         label: "Upgrade Now",
 *         icon: "fluent-emoji-high-contrast:sparkles",
 *         variant: "primary",
 *         onClick: handleUpgrade
 *       },
 *       {
 *         label: "Learn More",
 *         icon: "fluent:arrow-right-16-regular",
 *         variant: "accent",
 *         onClick: handleLearnMore
 *       }
 *     ]}
 *   >
 *     <Text>This feature is only available for Pro users.</Text>
 *   </LockedOverlay>
 * </Layout.Main>
 * ```
 *
 * @example
 * ```tsx
 * // Blocking a specific section with custom zIndex
 * <Box sx={{ position: 'relative' }}>
 *   <LockedOverlay
 *     isOpen={isOpen}
 *     zIndex={10}
 *     header={{
 *       icon: "fluent:lock-closed-24-filled",
 *       title: "Feature Locked",
 *       description: "Unlock this feature"
 *     }}
 *   >
 *     <Text>Content here</Text>
 *   </LockedOverlay>
 * </Box>
 * ```
 */
export const LockedOverlay = ({
  isOpen,
  onRequestClose,
  header,
  firstButton,
  secondButton,
  children,
  actions,
  sx,
  zIndex = 1,
}: LockedOverlayProps) => {
  const content = (
    <Card
      className="lockedoverlay-card"
      role="dialog"
      aria-modal={true}
      sx={{
        width: 'full',
        maxWidth: '620px',
        borderRadius: 'lg',
        overflow: 'auto',
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
              className="lockedoverlay-footer"
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
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Flex
      data-testid="lockedoverlay-overlay"
      onClick={() => {
        return onRequestClose?.();
      }}
      sx={{
        position: 'absolute',
        inset: 0,

        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex,
        ...sx,
      }}
    >
      <Flex
        onClick={(event) => {
          event.stopPropagation();
        }}
        sx={{
          width: 'full',
          maxWidth: ['95%', '90%', '620px'],
          maxHeight: '90%',
          justifyContent: 'center',
          overflow: 'auto',
        }}
      >
        {content}
      </Flex>
    </Flex>
  );
};
