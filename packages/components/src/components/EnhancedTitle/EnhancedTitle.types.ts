import type { BadgeProps } from '@ttoss/ui';

/**
 * Visual variant for the icon wrapper.
 */
export type EnhancedTitleVariant =
  | 'spotlight-accent'
  | 'spotlight-primary'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'informative'
  | 'muted';

/**
 * Badge configuration for top and bottom badge sections.
 */
export interface EnhancedTitleBadge {
  /**
   * Icon to display in the badge.
   */
  icon?: string;
  /**
   * Badge label text.
   */
  label: string;
  /**
   * Badge visual variant.
   */
  variant?: BadgeProps['variant'];
}

/**
 * Props for the EnhancedTitle component.
 */
export interface EnhancedTitleProps {
  /**
   * Visual variant for the icon wrapper.
   * @default 'primary'
   */
  variant?: EnhancedTitleVariant;
  /**
   * Icon to display next to the title.
   */
  icon?: string;
  /**
   * Main title text (heading).
   */
  title: string;
  /**
   * Optional subtitle/description text.
   */
  description?: string;
  /**
   * Optional text displayed next to the title (e.g., price, metadata).
   */
  frontTitle?: string;
  /**
   * Badges to display above the title.
   */
  topBadges?: EnhancedTitleBadge[];
  /**
   * Badges to display below the title.
   */
  bottomBadges?: EnhancedTitleBadge[];
}
