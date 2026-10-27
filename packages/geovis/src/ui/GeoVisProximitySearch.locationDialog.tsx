import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import * as React from 'react';

import { messages } from './GeoVisProximitySearch.messages';
import { KEYFRAMES } from './GeoVisProximitySearch.styles';
import { ACCENT, BORDER, SURFACE, TEXT_MUTED, TEXT_STRONG } from './palette';

/** A dialog button: the outlined secondary one, or the filled primary one. */
const DialogButton = ({
  primary,
  icon,
  buttonRef,
  onClick,
  children,
}: {
  primary?: boolean;
  icon?: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
  onClick: () => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      style={{
        flex: primary ? 1.4 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 36,
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        border: primary ? 0 : `1px solid ${BORDER}`,
        background: primary ? ACCENT : 'transparent',
        color: primary ? '#ffffff' : TEXT_MUTED,
      }}
    >
      {icon && <Icon icon={icon} style={{ fontSize: 14, display: 'block' }} />}
      {children}
    </button>
  );
};

/** Closes the dialog on `Escape`. */
const useEscape = (onEscape: () => void) => {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onEscape]);
};

/**
 * The dialog over the map around the browser's request: before it (`ask`),
 * why the location is needed and that it is kept nowhere; after a failure
 * (`denied`), what to do instead — try again, or search from a pin.
 */
export const LocationDialog = ({
  phase,
  results,
  onConfirm,
  onCancel,
}: {
  phase: 'ask' | 'denied';
  results: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const { intl } = useI18n();
  useEscape(onCancel);
  // Focus moves into the dialog, onto its default action.
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    confirmRef.current?.focus();
  }, [phase]);
  const ask = phase === 'ask';
  const title = intl.formatMessage(
    ask ? messages.askTitle : messages.deniedTitle
  );
  return (
    <div
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        background: 'rgba(36,31,33,0.32)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: '100%',
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          background: SURFACE,
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 24px 64px rgba(16,24,40,0.28)',
          overflow: 'hidden',
          animation: `${KEYFRAMES.fadeIn} .2s both`,
        }}
      >
        <div
          style={{
            padding: '22px 22px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 600, color: TEXT_STRONG }}>
            {title}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.55,
              color: TEXT_MUTED,
            }}
          >
            {ask
              ? intl.formatMessage(messages.askBody, { results })
              : intl.formatMessage(messages.deniedBody)}
          </p>
          {ask && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(0,0,0,0.04)',
                fontSize: 12,
                lineHeight: 1.45,
                color: TEXT_MUTED,
              }}
            >
              <Icon
                icon="lucide:shield-check"
                style={{ fontSize: 14, display: 'block', marginTop: 1 }}
              />
              {intl.formatMessage(messages.privacy)}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 20px',
            background: 'rgba(0,0,0,0.02)',
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <DialogButton onClick={onCancel}>
            {intl.formatMessage(ask ? messages.notNow : messages.usePin)}
          </DialogButton>
          <DialogButton
            primary
            buttonRef={confirmRef}
            icon={ask ? undefined : 'lucide:rotate-cw'}
            onClick={onConfirm}
          >
            {intl.formatMessage(ask ? messages.allow : messages.retry)}
          </DialogButton>
        </div>
      </div>
    </div>
  );
};
