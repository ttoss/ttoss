import { Icon } from '@ttoss/react-icons';
import { Box, Flex } from '@ttoss/ui';
import * as React from 'react';
import { createPortal } from 'react-dom';

export type MenuProps = {
  children: React.ReactNode;
  sx?: Record<string, unknown>;
  menuIcon?: string;
};

export const Menu = ({ children, sx, menuIcon = 'menu-open' }: MenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [stylePos, setStylePos] = React.useState<React.CSSProperties>({});
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  const toggle = () => {
    return setIsOpen((v) => {
      return !v;
    });
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        triggerRef.current &&
        !triggerRef.current.contains(t)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => {
      return document.removeEventListener('mousedown', onDocClick);
    };
  }, [isOpen]);

  React.useLayoutEffect(() => {
    if (!isOpen) return;
    let rafId = 0;

    const getWidth = () => {
      const w = sx?.width ?? sx?.maxWidth ?? sx?.minWidth;
      return Array.isArray(w) ? w[w.length - 1] : w;
    };

    const compute = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      const width = getWidth();
      if (width)
        panel.style.width =
          typeof width === 'number' ? `${width}px` : String(width);

      const tr = trigger.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      const vw = window.innerWidth,
        vh = window.innerHeight,
        m = 8;

      if (pr.width === 0) {
        rafId = requestAnimationFrame(compute);
        return;
      }

      const left = Math.max(
        m,
        Math.min(tr.left + tr.width / 2 - pr.width / 2, vw - pr.width - m)
      );
      const top =
        vh - tr.bottom < pr.height + m
          ? Math.max(m, tr.top - pr.height - m)
          : tr.bottom + m;

      setStylePos({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 9999,
        ...(width && {
          width: typeof width === 'number' ? `${width}px` : String(width),
        }),
      });
    };

    rafId = requestAnimationFrame(compute);
    const onResizeScroll = () => {
      return (rafId = requestAnimationFrame(compute));
    };
    window.addEventListener('resize', onResizeScroll);
    window.addEventListener('scroll', onResizeScroll, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResizeScroll);
      window.removeEventListener('scroll', onResizeScroll, true);
    };
  }, [isOpen, children, sx]);

  const panel = isOpen ? (
    <Flex
      ref={panelRef}
      sx={{
        ...sx,
        width: ['280px', '320px'],
        maxHeight: '400px',
        flexDirection: 'column',
        gap: '3',
        padding: '3',
        backgroundColor: 'input.background.muted.default',
        borderRadius: 'xl',
        boxShadow: 'xl',
        overflowY: 'auto',
        border: 'md',
        borderColor: 'display.border.muted.default',
      }}
      style={{ pointerEvents: 'auto', ...stylePos }}
    >
      <Box as="nav">{children}</Box>
    </Flex>
  ) : null;

  return (
    <Flex sx={{ position: 'relative', display: 'inline-block' }}>
      <Box sx={{ position: 'relative' }}>
        <button
          ref={triggerRef}
          onClick={toggle}
          aria-haspopup="true"
          aria-expanded={isOpen}
          style={{
            background: 'transparent',
            border: 0,
            padding: 4,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon icon={menuIcon} />
        </button>
        {isOpen && createPortal(panel, document.body)}
      </Box>
    </Flex>
  );
};
