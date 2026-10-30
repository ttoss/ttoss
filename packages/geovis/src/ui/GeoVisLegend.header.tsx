import { Icon } from '@ttoss/react-icons';
import type * as React from 'react';

import {
  DESCRIPTION_COLOR,
  FONT_HEAD,
  headerSectionStyle,
  SECTION_DIVIDER,
  TITLE_COLOR,
} from './GeoVisLegend.utils';

const titleTextStyle: React.CSSProperties = {
  fontFamily: FONT_HEAD,
  fontWeight: 600,
  fontSize: 15,
  color: TITLE_COLOR,
  lineHeight: 1.2,
};

const descriptionStyle: React.CSSProperties = {
  fontSize: 12,
  color: DESCRIPTION_COLOR,
  lineHeight: 1.55,
  margin: 0,
};

/** Tinted rounded chip holding the legend's `@ttoss/react-icons` glyph. */
const IconChip = ({ icon, color }: { icon: string; color: string }) => {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        borderRadius: 5,
        flexShrink: 0,
        backgroundColor: `${color}18`,
        color,
      }}
    >
      <Icon icon={icon} style={{ fontSize: 11, color }} />
    </span>
  );
};

const LegendTitleRow = ({
  icon,
  color,
  title,
  hasSubtitle,
}: {
  icon: string | undefined;
  color: string;
  title: string | undefined;
  hasSubtitle: boolean;
}) => {
  if (!icon && !title) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: hasSubtitle ? 5 : 0,
      }}
    >
      {!!icon && <IconChip icon={icon} color={color} />}
      {!!title && <span style={titleTextStyle}>{title}</span>}
    </div>
  );
};

/** The legend card's header: the icon chip, title and subtitle. */
export const GeoVisLegendHeader = ({
  icon,
  iconColor,
  title,
  subtitle,
  hasContentBelow,
}: {
  icon: string | undefined;
  iconColor: string;
  title: string | undefined;
  subtitle: string | undefined;
  hasContentBelow: boolean;
}) => {
  if (!icon && !title && !subtitle) return null;
  return (
    <div
      style={{
        ...headerSectionStyle,
        ...(hasContentBelow
          ? { borderBottom: `1px solid ${SECTION_DIVIDER}` }
          : {}),
      }}
    >
      <LegendTitleRow
        icon={icon}
        color={iconColor}
        title={title}
        hasSubtitle={!!subtitle}
      />
      {!!subtitle && <p style={descriptionStyle}>{subtitle}</p>}
    </div>
  );
};
