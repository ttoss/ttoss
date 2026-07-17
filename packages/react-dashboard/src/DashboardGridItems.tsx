import { Box, IconButton } from '@ttoss/ui';
import type * as React from 'react';

import type { DashboardTemplate } from './Dashboard';
import {
  DashboardCard,
  type DashboardCard as DashboardCardProps,
} from './DashboardCard';
import { DashboardSectionDivider } from './DashboardSectionDivider';

export const RemoveCardButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <IconButton
      aria-label="Remove card"
      icon="close"
      onClick={onClick}
      sx={{
        borderRadius: 'full',
        '&:hover': { color: 'red' },
        position: 'absolute',
        bottom: 1,
        right: 0,
        zIndex: 2,
      }}
    />
  );
};

export const DragHandle = () => {
  return (
    <IconButton
      className="dashboard-card-drag-handle"
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 1,
        cursor: 'grab',
        '&:active': { cursor: 'grabbing' },
      }}
      aria-label="Drag card"
      icon="lucide:grip-vertical"
    />
  );
};

type GridCardProps = {
  itemKey: string;
  card: DashboardCardProps;
  currency?: string;
  clickable: boolean;
  isEditMode: boolean;
  onCardClick: (key: string, card: DashboardCardProps) => void;
  onRemove: (key: string) => void;
};

export const GridCard = ({
  itemKey,
  card,
  currency,
  clickable,
  isEditMode,
  onCardClick,
  onRemove,
}: GridCardProps) => {
  const handleClick = clickable
    ? () => {
        return onCardClick(itemKey, card);
      }
    : undefined;
  const handleKeyDown = clickable
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') onCardClick(itemKey, card);
      }
    : undefined;
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      {isEditMode ? (
        <>
          <DragHandle />
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <DashboardCard {...{ currency }} {...card} />
            <RemoveCardButton
              onClick={() => {
                return onRemove(itemKey);
              }}
            />
          </Box>
        </>
      ) : (
        <DashboardCard {...{ currency }} {...card} />
      )}
    </div>
  );
};

type GridSectionDividerProps = {
  itemKey: string;
  card: React.ComponentProps<typeof DashboardSectionDivider>;
  isEditMode: boolean;
  onTitleChange: (key: string, title: string) => void;
  onRemove: (key: string) => void;
};

export const GridSectionDivider = ({
  itemKey,
  card,
  isEditMode,
  onTitleChange,
  onRemove,
}: GridSectionDividerProps) => {
  if (!isEditMode) return <DashboardSectionDivider {...card} />;
  return (
    <>
      <DragHandle />
      <Box
        sx={{
          position: 'relative',
          overflow: 'visible',
          width: '100%',
          height: '100%',
          border: 'sm',
          borderStyle: 'dashed',
          borderColor: 'display.border.muted.default',
          borderRadius: 'md',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <Box sx={{ paddingLeft: '6' }}>
          <DashboardSectionDivider
            {...card}
            editable
            onTitleChange={(title) => {
              return onTitleChange(itemKey, title);
            }}
          />
        </Box>
        <RemoveCardButton
          onClick={() => {
            return onRemove(itemKey);
          }}
        />
      </Box>
    </>
  );
};

export type BuildGridItemsProps = {
  template: DashboardTemplate;
  currency?: string;
  isEditMode: boolean;
  isCardClickable: (card: DashboardCardProps) => boolean;
  handleCardClick: (key: string, card: DashboardCardProps) => void;
  onRemove: (key: string) => void;
  onTitleChange: (key: string, title: string) => void;
};

export const buildGridItems = ({
  template,
  currency,
  isEditMode,
  isCardClickable,
  handleCardClick,
  onRemove,
  onTitleChange,
}: BuildGridItemsProps): React.ReactNode[] => {
  return template.grid.map((item) => {
    if (item.card.type === 'sectionDivider') {
      return (
        <div key={item.i}>
          <GridSectionDivider
            itemKey={item.i}
            card={item.card}
            isEditMode={isEditMode}
            onTitleChange={onTitleChange}
            onRemove={onRemove}
          />
        </div>
      );
    }
    const card = item.card as DashboardCardProps;
    return (
      <div key={item.i}>
        <GridCard
          itemKey={item.i}
          card={card}
          currency={currency}
          clickable={isCardClickable(card)}
          isEditMode={isEditMode}
          onCardClick={handleCardClick}
          onRemove={onRemove}
        />
      </div>
    );
  });
};
