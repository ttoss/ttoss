import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import { messages } from '../../messages';
import { type Hsv, hsvToHex, isHex, pointerFraction } from './hsv';
import { COLOR, FONT_HEAD, FONT_MONO } from './theme';

/*
 * The controls inside the custom-color picker card (see `ColorPickerCard`):
 * the saturation/brightness square, the hue bar, the hex field and the
 * cancel/apply pair.
 */

/** The hex field's border while the code is incomplete. */
const INVALID_BORDER = 'rgba(244,63,94,0.5)';

/** The prefix drawn before the hex digits, which the field itself omits. */
const HASH = '#';

/**
 * Pointer handlers that report a drag's position over an element: on press,
 * and on every move while pressed. The pointer is captured, so a drag that
 * leaves the element keeps reporting its nearest edge.
 */
const useDrag = (onFraction: (fraction: { x: number; y: number }) => void) => {
  const dragging = React.useRef(false);

  return {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      dragging.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      onFraction(pointerFraction(event, event.currentTarget));
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (dragging.current) {
        onFraction(pointerFraction(event, event.currentTarget));
      }
    },
    onPointerUp: () => {
      dragging.current = false;
    },
  };
};

/** Arrow-key steps for the square and the bar: a nudge, or ten with Shift. */
const step = (event: React.KeyboardEvent, size: number): number => {
  return event.shiftKey ? size * 10 : size;
};

/** The square: saturation left to right, brightness bottom to top. */
export const SaturationArea = ({
  hsv,
  onChange,
}: {
  hsv: Hsv;
  onChange: (next: Hsv) => void;
}) => {
  const { intl } = useI18n();
  const drag = useDrag(({ x, y }) => {
    onChange({ ...hsv, s: x, v: 1 - y });
  });

  const onKeyDown = (event: React.KeyboardEvent) => {
    const delta = step(event, 0.01);
    const moves: Record<string, Partial<Hsv>> = {
      ArrowLeft: { s: Math.max(0, hsv.s - delta) },
      ArrowRight: { s: Math.min(1, hsv.s + delta) },
      ArrowDown: { v: Math.max(0, hsv.v - delta) },
      ArrowUp: { v: Math.min(1, hsv.v + delta) },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({ ...hsv, ...move });
  };

  return (
    <Box
      {...({
        role: 'group',
        tabIndex: 0,
        'aria-label': intl.formatMessage(messages.colorPickerSaturation),
      } as object)}
      {...drag}
      onKeyDown={onKeyDown}
      sx={{
        position: 'relative',
        height: '128px',
        cursor: 'crosshair',
        touchAction: 'none',
        outline: 'none',
        backgroundColor: hsvToHex({ h: hsv.h, s: 1, v: 1 }),
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(to right, #ffffff, rgba(255,255,255,0))',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(to top, #000000, rgba(0,0,0,0))',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '14px',
          height: '14px',
          margin: '-7px 0 0 -7px',
          borderRadius: '999px',
          border: '2px solid #ffffff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          left: `${hsv.s * 100}%`,
          top: `${(1 - hsv.v) * 100}%`,
          backgroundColor: hsvToHex(hsv),
        }}
      />
    </Box>
  );
};

/** The hue bar, with the chosen color's dot beside it. */
export const HueRow = ({
  hsv,
  onChange,
}: {
  hsv: Hsv;
  onChange: (next: Hsv) => void;
}) => {
  const { intl } = useI18n();
  const drag = useDrag(({ x }) => {
    onChange({ ...hsv, h: x * 360 });
  });

  const onKeyDown = (event: React.KeyboardEvent) => {
    const delta = step(event, 1);
    const moves: Record<string, number> = {
      ArrowLeft: Math.max(0, hsv.h - delta),
      ArrowDown: Math.max(0, hsv.h - delta),
      ArrowRight: Math.min(360, hsv.h + delta),
      ArrowUp: Math.min(360, hsv.h + delta),
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    onChange({ ...hsv, h: next });
  };

  return (
    <Flex sx={{ alignItems: 'center', gap: '10px' }}>
      <Box
        sx={{
          width: '26px',
          height: '26px',
          flexShrink: 0,
          borderRadius: '999px',
          backgroundColor: hsvToHex(hsv),
          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
        }}
      />
      <Box
        {...({
          role: 'slider',
          tabIndex: 0,
          'aria-label': intl.formatMessage(messages.colorPickerHue),
          'aria-valuemin': 0,
          'aria-valuemax': 360,
          'aria-valuenow': Math.round(hsv.h),
        } as object)}
        {...drag}
        onKeyDown={onKeyDown}
        sx={{
          position: 'relative',
          flex: 1,
          height: '12px',
          borderRadius: '6px',
          cursor: 'pointer',
          touchAction: 'none',
          outline: 'none',
          background:
            'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            width: '14px',
            height: '14px',
            margin: '-7px 0 0 -7px',
            borderRadius: '999px',
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            left: `${(hsv.h / 360) * 100}%`,
          }}
        />
      </Box>
    </Flex>
  );
};

/**
 * The hex field. It takes hex digits only, up to six; a complete code — three
 * digits (short for six) or six — moves the square and the bar to it, and
 * anything else is marked, not applied.
 */
export const HexField = ({
  draft,
  onDraft,
  onApply,
}: {
  draft: string;
  onDraft: (next: string) => void;
  onApply: () => void;
}) => {
  const { intl } = useI18n();

  return (
    <Flex sx={{ alignItems: 'center', gap: '8px', marginTop: '12px' }}>
      <Flex
        sx={{
          flex: 1,
          minWidth: 0,
          alignItems: 'center',
          gap: '4px',
          height: '30px',
          padding: '0 8px',
          borderRadius: '6px',
          backgroundColor: COLOR.fillAlt,
          border: `1px solid ${isHex(draft) ? COLOR.border : INVALID_BORDER}`,
        }}
      >
        <Text
          sx={{
            fontFamily: FONT_MONO,
            fontSize: '12px',
            color: COLOR.textFaint,
          }}
        >
          {HASH}
        </Text>
        <input
          type="text"
          value={draft}
          maxLength={6}
          spellCheck={false}
          aria-label={intl.formatMessage(messages.colorPickerHex)}
          aria-invalid={!isHex(draft)}
          onChange={(event) => {
            onDraft(
              event.target.value
                .replace(/[^0-9a-f]/gi, '')
                .slice(0, 6)
                .toUpperCase()
            );
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onApply();
            }
          }}
          style={{
            flex: 1,
            minWidth: 0,
            border: 0,
            outline: 'none',
            background: 'transparent',
            fontFamily: FONT_MONO,
            fontSize: '12px',
            color: COLOR.textStrong,
            textTransform: 'uppercase',
          }}
        />
      </Flex>
      <Text
        sx={{
          flexShrink: 0,
          fontFamily: FONT_HEAD,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: COLOR.textMuted,
        }}
      >
        {intl.formatMessage(messages.colorPickerHexUnit)}
      </Text>
    </Flex>
  );
};

/** Cancel and apply, side by side. */
export const Actions = ({
  canApply,
  onCancel,
  onApply,
}: {
  canApply: boolean;
  onCancel: () => void;
  onApply: () => void;
}) => {
  const { intl } = useI18n();
  const label = {
    height: '30px',
    borderRadius: '6px',
    fontFamily: FONT_HEAD,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  } as const;

  return (
    <Flex sx={{ gap: '6px', marginTop: '12px' }}>
      <Box
        as="button"
        {...({ type: 'button' } as object)}
        onClick={onCancel}
        sx={{
          ...label,
          flex: 1,
          cursor: 'pointer',
          backgroundColor: 'transparent',
          border: `1px solid ${COLOR.border}`,
          color: COLOR.textMuted,
        }}
      >
        {intl.formatMessage(messages.colorPickerCancel)}
      </Box>
      <Box
        as="button"
        {...({ type: 'button', disabled: !canApply } as object)}
        onClick={onApply}
        sx={{
          ...label,
          flex: 1,
          border: 0,
          cursor: canApply ? 'pointer' : 'not-allowed',
          backgroundColor: canApply ? COLOR.primary : COLOR.textDisabled,
          color: COLOR.surface,
          '&:hover': canApply ? { backgroundColor: COLOR.primaryDark } : {},
        }}
      >
        {intl.formatMessage(messages.colorPickerApply)}
      </Box>
    </Flex>
  );
};
