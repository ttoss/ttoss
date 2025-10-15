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
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  const toggle = () => {
    return setIsOpen((v) => {
      return !v;
    });
  };

  // fecha ao clicar fora
  React.useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
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

  // calcula posição e evita overflow; usa layout effect para garantir medidas corretas
  React.useLayoutEffect(() => {
    if (!isOpen) return;
    let rafId = 0;

    const getWidthFromSx = (sxObj: unknown) => {
      if (!sxObj || typeof sxObj !== 'object') return undefined;
      const obj = sxObj as Record<string, unknown>;
      const w = obj.width ?? obj.maxWidth ?? obj.minWidth;
      if (w === undefined) return undefined;
      if (Array.isArray(w)) return w[w.length - 1]; // pega último valor responsivo
      return w;
    };

    const compute = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;

      // se o usuário passou width via sx, aplica direto no DOM antes de medir
      const desiredWidth = getWidthFromSx(sx);
      if (desiredWidth !== undefined) {
        const widthStr =
          typeof desiredWidth === 'number'
            ? `${desiredWidth}px`
            : String(desiredWidth);
        // aplica inline para que getBoundingClientRect reflita imediatamente
        panel.style.width = widthStr;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 8;

      // largura do painel pode ser responsiva; se width for 0, espera próximo frame
      if (panelRect.width === 0) {
        rafId = requestAnimationFrame(compute);
        return;
      }

      // centraliza horizontalmente no centro do gatilho
      let left = Math.round(
        triggerRect.left + triggerRect.width / 2 - panelRect.width / 2
      );
      // clamp horizontal para não sair da viewport
      left = Math.max(margin, Math.min(left, vw - panelRect.width - margin));

      // prefere abaixo, se não couber, coloca acima
      const spaceBelow = vh - triggerRect.bottom;
      const placeAbove = spaceBelow < panelRect.height + margin;
      const top = placeAbove
        ? Math.round(triggerRect.top - panelRect.height - margin)
        : Math.round(triggerRect.bottom + margin);

      setStylePos({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: 9999,
      });
    };

    // calcular uma vez após render + recalcular em resize/scroll
    rafId = requestAnimationFrame(compute);
    const onResize = () => {
      return (rafId = requestAnimationFrame(compute));
    };
    const onScroll = () => {
      return (rafId = requestAnimationFrame(compute));
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, children, sx]);

  const panel = isOpen ? (
    <Flex
      ref={panelRef}
      sx={{
        // position fixed coords applied inline from stylePos so ref measures the actual panel
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

        {/* renderiza em portal para evitar corte por overflow de pais */}
        {isOpen && createPortal(panel, document.body)}
      </Box>
    </Flex>
  );
};
