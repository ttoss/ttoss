import { useI18n } from '@ttoss/react-i18n';
import { Flex, Text } from '@ttoss/ui';
import * as React from 'react';

import { findLayerControl, findLegendCards } from '../export/captureOverlay';
import {
  canvasToPngBlob,
  composeMapImage,
  downloadBlob,
  type ExportOverlay,
} from '../export/composeMapImage';
import { suggestFileName } from '../export/exportFileName';
import {
  type MapExportContent,
  useMapExportContent,
} from '../export/useMapExportContent';
import { type MapSnapshot, useMapSnapshot } from '../export/useMapSnapshot';
import { messages } from '../messages';
import {
  DialogHeader,
  FileNameField,
  Footer,
  OptionToggle,
  PNG_EXTENSION,
  Preview,
} from './ExportMapDialog.parts';
import { COLOR } from './LeftSidebar/theme';

/** What a composition draws: the frame, and whatever the toggles leave on. */
interface Composition {
  includeLegend: boolean;
  menu?: ExportOverlay[];
}

const compose = ({
  snapshot,
  includeLegend,
  menu,
}: Composition & { snapshot: MapSnapshot }): HTMLCanvasElement => {
  return composeMapImage({
    snapshot: snapshot.canvas,
    overlays: [...(includeLegend ? snapshot.legends : []), ...(menu ?? [])],
  });
};

/**
 * The preview, recomposed whenever a toggle changes. Encoding is where a canvas
 * tainted by cross-origin tiles fails, so that failure surfaces here first.
 */
const usePreview = ({
  snapshot,
  composition,
}: {
  snapshot?: MapSnapshot;
  composition: Composition;
}) => {
  return React.useMemo(() => {
    if (!snapshot) return { src: undefined, failed: false };

    try {
      const canvas = compose({ snapshot, ...composition });
      return { src: canvas.toDataURL('image/png'), failed: false };
    } catch {
      return { src: undefined, failed: true };
    }
  }, [snapshot, composition]);
};

/** Focuses the card on open, and closes it on Escape. */
const useDialogDismiss = ({
  dialogRef,
  onClose,
}: {
  dialogRef: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) => {
  React.useEffect(() => {
    dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [dialogRef, onClose]);
};

/**
 * The download: composes the file from the same frame as the preview, saves it,
 * and closes. A failure keeps the dialog open and is reported.
 */
const useDownload = ({
  composition,
  fileName,
  onClose,
}: {
  composition: Composition;
  fileName: string;
  onClose: () => void;
}) => {
  const [exporting, setExporting] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  // Takes the frame rather than reading it: the button only gets this handler
  // once there is a frame (and is disabled while exporting or waiting on the
  // menu), so there is nothing left to guard against in here.
  const download = async (snapshot: MapSnapshot) => {
    setExporting(true);
    setFailed(false);

    try {
      const blob = await canvasToPngBlob(compose({ snapshot, ...composition }));
      downloadBlob({ blob, fileName: `${fileName}${PNG_EXTENSION}` });
      onClose();
    } catch {
      setFailed(true);
      setExporting(false);
    }
  };

  return { exporting, failed, download };
};

/** The dimmed layer over the whole workspace; a click on it closes the dialog. */
const ExportBackdrop = ({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <Flex
      onPointerDown={(event: React.PointerEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
      }}
      sx={{
        position: 'absolute',
        inset: 0,
        // Above both sidebar overlays (`zIndex: 2`): the dialog is about the
        // whole map, and a sidebar left over it would cover part of it.
        zIndex: 3,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
        backgroundColor: 'rgba(36,31,33,0.32)',
        '@keyframes geovisWorkspaceExportFade': {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        animation: 'geovisWorkspaceExportFade 0.2s ease-out',
        // Whoever asked the system for less motion gets the dialog in place
        // at once, the backdrop and the card alike.
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      {children}
    </Flex>
  );
};

/**
 * The reader's choices — the two toggles and the file name — and what follows
 * from them: the composition to draw, the name to save under, and whether the
 * menu asked for is still being rendered.
 */
const useExportOptions = ({
  content,
  menu,
  menuFailed,
}: {
  content: MapExportContent;
  menu?: ExportOverlay[];
  menuFailed: boolean;
}) => {
  const [includeLegend, setIncludeLegend] = React.useState(true);
  const [includeMenu, setIncludeMenu] = React.useState(false);
  // `null` until the reader types, so the suggestion keeps following the map.
  const [fileName, setFileName] = React.useState<string | null>(null);

  const suggestedName = suggestFileName({
    title: content.title.label,
    year: content.title.year,
  });

  const menuLayer = includeMenu ? menu : undefined;
  const composition = React.useMemo(() => {
    return { includeLegend, menu: menuLayer };
  }, [includeLegend, menuLayer]);

  return {
    includeLegend,
    includeMenu,
    toggleLegend: () => {
      setIncludeLegend((on) => {
        return !on;
      });
    },
    toggleMenu: () => {
      setIncludeMenu((on) => {
        return !on;
      });
    },
    fieldValue: fileName ?? suggestedName,
    setFileName,
    downloadName: fileName?.trim() || suggestedName,
    composition,
    // Asked for, but still being rendered: the download waits rather than
    // saving an image without the menu the reader just turned on.
    menuPending: includeMenu && !menu && !menuFailed,
  };
};

/** Whether any capture, encoding or download has failed for what is asked. */
const hasExportError = ({
  failures,
  includeLegend,
  legendsFailed,
  includeMenu,
  menuFailed,
}: {
  failures: boolean[];
  includeLegend: boolean;
  legendsFailed: boolean;
  includeMenu: boolean;
  menuFailed: boolean;
}): boolean => {
  return (
    failures.includes(true) ||
    (includeLegend && legendsFailed) ||
    (includeMenu && menuFailed)
  );
};

/**
 * The map's overlays on screen — the legend cards and the layer control —
 * looked up once the dialog is in the page: it is how the dialog finds the
 * workspace they sit in. A layout effect, so the legend toggle is settled
 * before the first paint rather than popping in.
 */
const useMapOverlays = (dialogRef: React.RefObject<HTMLDivElement | null>) => {
  const [overlays, setOverlays] = React.useState<{
    legendCards: HTMLElement[];
    layerControl: HTMLElement | null;
  }>();

  React.useLayoutEffect(() => {
    setOverlays({
      legendCards: findLegendCards(dialogRef.current),
      layerControl: findLayerControl(dialogRef.current),
    });
  }, [dialogRef]);

  return overlays;
};

/**
 * What the preview frame shows: the image once composed, a spinner until then
 * (unless a capture failed), and the size the frame will have — known before
 * it lands, so the spinner's box is the image's and nothing moves when the
 * preview replaces it.
 */
const resolvePreviewFrame = ({
  preview,
  failed,
  snapshot,
  frameSize,
}: {
  preview: { src?: string; failed: boolean };
  failed: boolean;
  snapshot?: MapSnapshot;
  frameSize?: { width: number; height: number };
}) => {
  const size = snapshot?.canvas ?? frameSize;

  return {
    src: preview.src,
    loading: !preview.src && !failed && !preview.failed,
    width: size?.width,
    height: size?.height,
  };
};

/**
 * The two toggles, each shown only when there is something on screen for it to
 * include: a legend card, and an open sidebar.
 */
const ExportToggles = ({
  hasLegend,
  hasMenu,
  options,
}: {
  hasLegend: boolean;
  hasMenu: boolean;
  options: ReturnType<typeof useExportOptions>;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  return (
    <Flex sx={{ flexDirection: 'column', gap: '6px' }}>
      {hasLegend ? (
        <OptionToggle
          label={formatMessage(messages.exportIncludeLegend)}
          on={options.includeLegend}
          onToggle={options.toggleLegend}
        />
      ) : null}
      {hasMenu ? (
        <OptionToggle
          label={formatMessage(messages.exportIncludeMenu)}
          on={options.includeMenu}
          onToggle={options.toggleMenu}
        />
      ) : null}
    </Flex>
  );
};

/**
 * The map export dialog: a preview of the PNG as it will be saved, the file
 * name, and two toggles — the legend cards and the menu (the left sidebar, with
 * the map's layer control when it has one), each as it sits over the map. The
 * legend toggle starts on and shows only when there is a legend on screen; the
 * menu toggle starts off and shows only when there is an open sidebar to
 * capture.
 *
 * The map, the legends and the menu are captured once on open; the toggles
 * only change what is drawn over that frame, so either one is a recomposition,
 * not a new capture. The image keeps the map canvas's own resolution: what the
 * reader sees, at the screen's pixel density.
 *
 * Closes on Escape, on a click on the backdrop, on Cancel, and after a
 * successful download. A failure — a canvas tainted by tiles served without
 * CORS, typically — keeps the dialog open with the error shown.
 */
export const ExportMapDialog = ({
  menuRef,
  onClose,
}: {
  /** The open left sidebar's overlay; omitted when there is none to capture. */
  menuRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) => {
  const {
    intl: { formatMessage },
  } = useI18n();

  const dialogRef = React.useRef<HTMLDivElement>(null);
  useDialogDismiss({ dialogRef, onClose });
  const overlays = useMapOverlays(dialogRef);
  const legendCards = overlays?.legendCards;

  const content = useMapExportContent();
  const { snapshot, frameSize, failed, legendsFailed, menu, menuFailed } =
    useMapSnapshot({
      menuRef,
      legendCards,
      layerControl: overlays?.layerControl,
    });

  const options = useExportOptions({ content, menu, menuFailed });

  const preview = usePreview({ snapshot, composition: options.composition });
  const downloadState = useDownload({
    composition: options.composition,
    fileName: options.downloadName,
    onClose,
  });

  const busy = downloadState.exporting || options.menuPending;

  return (
    <ExportBackdrop onClose={onClose}>
      <Flex
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={formatMessage(messages.exportTitle)}
        tabIndex={-1}
        sx={{
          flexDirection: 'column',
          width: '100%',
          maxWidth: '440px',
          maxHeight: '100%',
          overflow: 'hidden',
          outline: 'none',
          backgroundColor: COLOR.surface,
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(16,24,40,0.28)',
          // Rises a few pixels while it fades in, a little longer than the
          // backdrop, so the card reads as landing on the dimmed map.
          '@keyframes geovisWorkspaceExportRise': {
            from: { opacity: 0, transform: 'translateY(8px) scale(0.98)' },
            to: { opacity: 1, transform: 'translateY(0) scale(1)' },
          },
          animation:
            'geovisWorkspaceExportRise 0.24s cubic-bezier(0.2, 0, 0, 1)',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
        }}
      >
        <DialogHeader onClose={onClose} />

        <Flex
          sx={{
            flex: 1,
            minHeight: 0,
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            // The dialog covers the map; its scroll must not leak to the page.
            overscrollBehavior: 'contain',
            paddingX: '20px',
            paddingTop: '16px',
            paddingBottom: '20px',
          }}
        >
          <Preview
            {...resolvePreviewFrame({ preview, failed, snapshot, frameSize })}
          />

          {hasExportError({
            failures: [failed, preview.failed, downloadState.failed],
            includeLegend: options.includeLegend,
            legendsFailed,
            includeMenu: options.includeMenu,
            menuFailed,
          }) ? (
            <Text role="alert" sx={{ fontSize: '12px', color: '#b42318' }}>
              {formatMessage(messages.exportError)}
            </Text>
          ) : null}

          <FileNameField
            value={options.fieldValue}
            onChange={options.setFileName}
          />

          <ExportToggles
            hasLegend={!!legendCards?.length}
            hasMenu={!!menuRef}
            options={options}
          />
        </Flex>

        <Footer
          busy={busy}
          disabled={busy || !snapshot}
          onCancel={onClose}
          onDownload={
            snapshot
              ? () => {
                  downloadState.download(snapshot);
                }
              : undefined
          }
        />
      </Flex>
    </ExportBackdrop>
  );
};

/**
 * Mounts the dialog while it is open. Owns the one decision `Layout` would
 * otherwise make inline: only an open sidebar is offered as the menu — a closed
 * one is off-screen and hidden, so there would be nothing of it to draw.
 */
export const ExportMapOverlay = ({
  open,
  menuOpen,
  menuRef,
  onClose,
}: {
  open: boolean;
  menuOpen: boolean;
  menuRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) => {
  if (!open) return null;

  return (
    <ExportMapDialog
      menuRef={menuOpen ? menuRef : undefined}
      onClose={onClose}
    />
  );
};
