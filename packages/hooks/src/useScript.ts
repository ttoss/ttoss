import * as React from 'react';

export type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * https://usehooks.com/useScript/
 *
 * @param src: string - the url of the script to load.
 * @returns status: Status
 */
export const useScript = (src: string) => {
  /**
   * Keep track of script status ("idle", "loading", "ready", "error")
   */
  const [status, setStatus] = React.useState<ScriptStatus>(
    src ? 'loading' : 'idle'
  );

  React.useEffect(
    () => {
      /**
       * Allow falsy src value if waiting on other data needed for
       * constructing the script URL passed to this hook.
       */
      if (!src) {
        setStatus('idle');
        return;
      }

      /**
       * Fetch existing script element by src.
       * It may have been added by another instance of this hook.
       */
      let script: HTMLScriptElement | null = document.querySelector(
        `script[src="${src}"]`
      );

      if (!script) {
        /**
         * Create script element and set its src.
         */
        script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.setAttribute('data-status', 'loading');

        /**
         * Add script to document body
         */
        document.body.appendChild(script);

        /**
         * Store status in attribute on script.
         * This can be read by other instances of this hook.
         */
        const setAttributeFromEvent = (event: any) => {
          if (script) {
            script.setAttribute(
              'data-status',
              event.type === 'load' ? 'ready' : 'error'
            );
          }
        };
        script.addEventListener('load', setAttributeFromEvent);
        script.addEventListener('error', setAttributeFromEvent);
      } else {
        /**
         * Grab existing script status from attribute and set to state.
         */
        setStatus(
          (script.getAttribute('data-status') as ScriptStatus) || 'error'
        );
      }

      /**
       * Script event handler to update status in state
       * Note: Even if the script already exists we still need to add
       * event handlers to update the state for *this* hook instance.
       */
      const setStateFromEvent = (event: any) => {
        setStatus(event.type === 'load' ? 'ready' : 'error');
      };

      /**
       * Add event listeners.
       */
      script.addEventListener('load', setStateFromEvent);
      script.addEventListener('error', setStateFromEvent);

      /**
       * Remove event listeners on cleanup.
       */
      return () => {
        if (script) {
          script.removeEventListener('load', setStateFromEvent);
          script.removeEventListener('error', setStateFromEvent);
        }
      };
    },
    /**
     * Only re-run effect if script src changes.
     */
    [src]
  );

  return { status };
};
