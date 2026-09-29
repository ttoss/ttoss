import { useI18n } from '@ttoss/react-i18n';
import { Box } from '@ttoss/ui';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { messages } from '../../messages';
import {
  Actions,
  HexField,
  HueRow,
  SaturationArea,
} from './ColorPickerControls';
import { hexToHsv, type Hsv, hsvToHex, isHex6 } from './hsv';
import { COLOR } from './theme';

/** The card's width, and the height it is placed by — above when it would overflow below. */
const CARD_WIDTH = 232;
const CARD_HEIGHT = 264;
/** Gap between the button and the card, which the arrow bridges. */
const GAP = 10;
/** The card never sits closer than this to the viewport's edges. */
const EDGE = 8;

type Placement = {
  top: number;
  left: number;
  /** The arrow's left offset inside the card, so it points at the button. */
  arrowLeft: number;
  below: boolean;
};

/**
 * Where the card sits: under the button, centred on it and kept inside the
 * viewport, or above it when there is no room below. Recomputed on resize and
 * on any scroll, since the card is fixed to the viewport while the button
 * scrolls with the sidebar.
 */
const usePlacement = (anchor: HTMLElement): Placement | null => {
  const [placement, setPlacement] = React.useState<Placement | null>(null);

  React.useLayoutEffect(() => {
    const place = () => {
      const box = anchor.getBoundingClientRect();
      const centre = box.left + box.width / 2;
      const left = Math.min(
        Math.max(EDGE, centre - CARD_WIDTH / 2),
        window.innerWidth - CARD_WIDTH - EDGE
      );
      const below = box.bottom + GAP + CARD_HEIGHT <= window.innerHeight;
      setPlacement({
        top: below ? box.bottom + GAP : box.top - GAP - CARD_HEIGHT,
        left,
        arrowLeft: centre - left - 5,
        below,
      });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchor]);

  return placement;
};

/**
 * Closes the card on `Escape` and on a press outside both the card and the
 * button that opened it — the button toggles the card through its own click.
 */
const useDismiss = ({
  card,
  anchor,
  onCancel,
}: {
  card: React.RefObject<HTMLDivElement | null>;
  anchor: HTMLElement;
  onCancel: () => void;
}) => {
  const onCancelRef = React.useRef(onCancel);
  React.useEffect(() => {
    onCancelRef.current = onCancel;
  });

  React.useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (card.current?.contains(target) || anchor.contains(target)) return;
      onCancelRef.current();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancelRef.current();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [card, anchor]);
};

/** The small diamond that points the card at the button that opened it. */
const Arrow = ({ placement }: { placement: Placement }) => {
  const edge = `1px solid ${COLOR.border}`;
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        width: '10px',
        height: '10px',
        backgroundColor: '#ffffff',
        transform: 'rotate(45deg)',
        left: `${placement.arrowLeft}px`,
        ...(placement.below
          ? { top: '-6px', borderLeft: edge, borderTop: edge }
          : { bottom: '-6px', borderRight: edge, borderBottom: edge }),
      }}
    />
  );
};

/**
 * The custom-color picker the ramp editor's pipette opens: a
 * saturation/brightness square, a hue bar and a hex field, then cancel or
 * apply. It replaces the browser's native color input, whose dialog looks
 * different on every platform and cannot be kept beside the ramp it feeds.
 *
 * Rendered in a portal on `document.body` and fixed to the viewport, under the
 * button that opened it (above it when there is no room). The sidebar slides
 * with a CSS transform, and a fixed element inside a transformed one is placed
 * against that element rather than the viewport — it would be clipped by the
 * sidebar's own overflow.
 *
 * @param params.anchor - The button that opened it, which it points at.
 * @param params.color - The color it opens on, as a hex string.
 * @param params.onApply - Called with the chosen color, `#rrggbb`.
 * @param params.onCancel - Closes without applying: the cancel button,
 *   `Escape`, or a press outside.
 * @returns The card, or nothing until it has been placed. It is only ever
 *   opened by a click, so it never renders on the server.
 *
 * @example
 * <ColorPickerCard anchor={button} color="#3b82f6" onApply={pick} onCancel={close} />
 */
export const ColorPickerCard = ({
  anchor,
  color,
  onApply,
  onCancel,
}: {
  anchor: HTMLElement;
  color: string;
  onApply: (color: string) => void;
  onCancel: () => void;
}) => {
  const { intl } = useI18n();
  const card = React.useRef<HTMLDivElement>(null);
  const placement = usePlacement(anchor);
  const [hsv, setHsv] = React.useState<Hsv>(() => {
    return hexToHsv(color);
  });
  const [draft, setDraft] = React.useState(() => {
    return hsvToHex(hexToHsv(color)).slice(1).toUpperCase();
  });
  useDismiss({ card, anchor, onCancel });

  // The square and the bar drive the field; a full code in the field drives them.
  const changeHsv = (next: Hsv) => {
    setHsv(next);
    setDraft(hsvToHex(next).slice(1).toUpperCase());
  };
  const changeDraft = (next: string) => {
    setDraft(next);
    if (isHex6(next)) setHsv(hexToHsv(next));
  };
  const apply = () => {
    if (isHex6(draft)) onApply(hsvToHex(hsv));
  };

  if (!placement) return null;

  return createPortal(
    <Box
      ref={card}
      {...({
        role: 'dialog',
        'aria-label': intl.formatMessage(messages.customColor),
      } as object)}
      sx={{
        position: 'fixed',
        zIndex: 60,
        width: `${CARD_WIDTH}px`,
        top: `${placement.top}px`,
        left: `${placement.left}px`,
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: `1px solid ${COLOR.border}`,
        boxShadow: '0 12px 32px rgba(16,24,40,0.22)',
      }}
    >
      <Arrow placement={placement} />
      <Box
        sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden' }}
      >
        <SaturationArea hsv={hsv} onChange={changeHsv} />
        <Box sx={{ padding: '12px' }}>
          <HueRow hsv={hsv} onChange={changeHsv} />
          <HexField draft={draft} onDraft={changeDraft} onApply={apply} />
          <Actions
            canApply={isHex6(draft)}
            onCancel={onCancel}
            onApply={apply}
          />
        </Box>
      </Box>
    </Box>,
    document.body
  );
};
