import * as React from 'react';

/**
 * A modal built on the native `<dialog>`: the browser traps focus, closes it
 * on Escape and renders it above the page, so no portal is needed.
 */
export const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal?.();
    } else if (!open && dialog.open) {
      dialog.close?.();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="oa:m-auto oa:w-[calc(100%-2rem)] oa:max-w-md oa:rounded-lg oa:border oa:border-solid oa:border-border oa:bg-background oa:p-6 oa:text-sm oa:text-foreground oa:shadow-lg oa:backdrop:bg-black/40"
    >
      {open && (
        <div className="oa:flex oa:flex-col oa:gap-4">
          <div className="oa:flex oa:flex-col oa:gap-1.5">
            <h2 id={titleId} className="oa:m-0 oa:text-lg oa:font-semibold">
              {title}
            </h2>
            {description && (
              <p className="oa:m-0 oa:text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
};
