import * as React from 'react';
import {
  Link as LinkUi,
  type LinkProps as LinkPropsUi,
  type ThemeUIStyleObject,
} from 'theme-ui';

const defaultVisitedLinkStyles: ThemeUIStyleObject = {
  color: 'navigation.text.primary.default',
};

const defaultWarningVisitedLinkStyles: ThemeUIStyleObject = {
  color: 'feedback.text.caution.default',
};

const defaultVisitedStyles: ThemeUIStyleObject = {
  ':visited': defaultVisitedLinkStyles,
  '&.warning:visited': defaultWarningVisitedLinkStyles,
};

const isThemeUIStyleObject = (value: unknown): value is ThemeUIStyleObject => {
  return typeof value === 'object' && value !== null;
};

/**
 * Extracts selector-specific styles from a theme-ui sx object when present.
 */
const getSelectorStyles = ({
  selector,
  sx,
}: {
  selector: string;
  sx?: LinkPropsUi['sx'];
}): ThemeUIStyleObject => {
  if (!isThemeUIStyleObject(sx)) {
    return {};
  }

  const selectorStyles = Object.entries(sx).find(([key]) => {
    return key === selector;
  })?.[1];

  return isThemeUIStyleObject(selectorStyles) ? selectorStyles : {};
};

/**
 * Merges the default visited-link styles with any caller-provided sx overrides.
 */
const getLinkSx = ({ sx }: { sx?: LinkPropsUi['sx'] }): LinkPropsUi['sx'] => {
  if (!isThemeUIStyleObject(sx)) {
    return defaultVisitedStyles;
  }

  return {
    ...defaultVisitedStyles,
    ...sx,
    ':visited': {
      ...defaultVisitedLinkStyles,
      ...getSelectorStyles({ selector: ':visited', sx }),
    },
    '&.warning:visited': {
      ...defaultWarningVisitedLinkStyles,
      ...getSelectorStyles({ selector: '&.warning:visited', sx }),
    },
  };
};

export type LinkProps = LinkPropsUi & {
  quiet?: boolean;
};

/**
 * Renders a themed anchor element with consistent visited-link contrast across ttoss themes.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ quiet, className, sx, ...props }, ref) => {
    return (
      <LinkUi
        className={`${quiet ? 'quiet' : ''} ${className ?? ''}`}
        {...props}
        ref={ref}
        sx={getLinkSx({ sx })}
      />
    );
  }
);

Link.displayName = 'Link';
