import * as React from 'react';

export type ScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Scripts whose `data-status` attribute is kept in sync with their load and
 * error events. Tracking lives on the element (not on a hook instance) so a
 * later instance reading the attribute sees the real status even if the
 * instance that created the script has unmounted.
 */
const trackedScripts = new WeakSet<HTMLScriptElement>();

const findScript = (src: string) => {
  return document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
};

const trackScriptStatus = (script: HTMLScriptElement) => {
  if (trackedScripts.has(script)) {
    return;
  }

  trackedScripts.add(script);

  const setAttributeFromEvent = (event: Event) => {
    script.setAttribute(
      'data-status',
      event.type === 'load' ? 'ready' : 'error'
    );
  };

  script.addEventListener('load', setAttributeFromEvent);
  script.addEventListener('error', setAttributeFromEvent);
};

/**
 * Fetch the existing script element by src (it may have been added by
 * another instance of this hook) or create it.
 */
const getOrCreateScript = (src: string) => {
  const existingScript = findScript(src);

  if (existingScript) {
    return existingScript;
  }

  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.setAttribute('data-status', 'loading');
  trackScriptStatus(script);
  document.body.appendChild(script);

  return script;
};

/**
 * https://usehooks.com/useScript/
 *
 * The script element is an external store: its `data-status` attribute is the
 * snapshot and its load/error events are the change notifications.
 *
 * @param src: string - the url of the script to load. A falsy value is
 * allowed while waiting on data needed to build the URL; status is `idle`.
 * @returns status: Status
 */
export const useScript = (src: string) => {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      if (!src) {
        return () => {};
      }

      const script = getOrCreateScript(src);

      /**
       * Scripts not created by this hook get their attribute tracked too,
       * registered before the listener below so the snapshot read on change
       * already reflects the event.
       */
      trackScriptStatus(script);

      script.addEventListener('load', onStoreChange);
      script.addEventListener('error', onStoreChange);

      return () => {
        script.removeEventListener('load', onStoreChange);
        script.removeEventListener('error', onStoreChange);
      };
    },
    [src]
  );

  const getSnapshot = (): ScriptStatus => {
    if (!src) {
      return 'idle';
    }

    const script = findScript(src);

    if (!script) {
      return 'loading';
    }

    return (script.getAttribute('data-status') as ScriptStatus) || 'error';
  };

  /**
   * The server never has the script element, so it reports the status the
   * client starts from before the script is added.
   */
  const getServerSnapshot = (): ScriptStatus => {
    return src ? 'loading' : 'idle';
  };

  const status = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return { status };
};
