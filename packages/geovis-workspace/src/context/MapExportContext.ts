import * as React from 'react';

/** Opens the export dialog. */
export interface MapExportContextValue {
  openExport: () => void;
}

/**
 * Lets the sidebar's export button open a dialog it does not render.
 *
 * The dialog covers the whole workspace, so it lives in `Layout` beside the
 * sidebars rather than inside the left one: the sidebar overlay is transformed
 * as it slides, which makes it the containing block of anything absolutely
 * positioned within it — a dialog there could never reach past the card.
 *
 * The default is inert, so a sidebar rendered outside `Layout` (in a test, or
 * standalone) keeps a working button that simply does nothing.
 */
export const MapExportContext = React.createContext<MapExportContextValue>({
  openExport: () => {},
});

/**
 * Reads the export dialog's opener.
 *
 * @returns The context; an inert opener outside a provider.
 *
 * @example
 * const { openExport } = useMapExportContext();
 */
export const useMapExportContext = (): MapExportContextValue => {
  return React.useContext(MapExportContext);
};

/**
 * The export dialog's open state and the context value that opens it, held by
 * `Layout` — the common ancestor of the sidebar button and the dialog.
 *
 * @returns Whether the dialog is open, the provider value, and its closer.
 *
 * @example
 * const { isOpen, value, close } = useMapExportState();
 */
export const useMapExportState = () => {
  const [isOpen, setOpen] = React.useState(false);

  const value = React.useMemo<MapExportContextValue>(() => {
    return {
      openExport: () => {
        setOpen(true);
      },
    };
  }, []);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  return { isOpen, value, close };
};
