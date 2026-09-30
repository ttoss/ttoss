import { AsyncLocalStorage } from 'node:async_hooks';

import { Sequelize } from './sequelize-typescript';

/** The namespace shape Sequelize 6 reads for its implicit transaction (`useCLS`). */
type ClsNamespace = {
  run: (fn: (context: Map<string, unknown>) => unknown) => unknown;
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  bind: <T>(fn: T) => T;
};

// Backed by `AsyncLocalStorage` rather than `cls-hooked`, which is built on the
// deprecated `async_hooks` callbacks. A query outside `atomically` sees no
// store, so it runs exactly as it would without CLS enabled.
const storage = new AsyncLocalStorage<Map<string, unknown>>();

const namespace: ClsNamespace = {
  run: (fn) => {
    const context = new Map<string, unknown>();

    return storage.run(context, () => {
      return fn(context);
    });
  },
  get: (key) => {
    return storage.getStore()?.get(key);
  },
  set: (key, value) => {
    storage.getStore()?.set(key, value);
  },
  bind: (fn) => {
    return fn;
  },
};

const clsOf = (sequelize: Sequelize): ClsNamespace | undefined => {
  return (sequelize.constructor as unknown as { _cls?: ClsNamespace })._cls;
};

// Installed on first use rather than at import, so importing the package never
// changes how an application's transactions behave. A namespace the
// application installed itself (`cls-hooked`) is kept and used as is.
const enableCls = (sequelize: Sequelize): ClsNamespace => {
  const installed = clsOf(sequelize);

  if (installed) {
    return installed;
  }

  // Bound to a name first: the React hooks lint rule reads `use…` on anything.
  const installNamespace = Sequelize.useCLS.bind(Sequelize);

  installNamespace(namespace);

  return namespace;
};

export type AtomicallyOptions<T> = {
  sequelize: Sequelize;
  /** What runs inside the transaction. */
  fn: () => Promise<T>;
};

/**
 * Runs `fn` as one transaction: every query inside it commits together, or
 * none does, without a `transaction` option threaded through each call.
 *
 * Built on Sequelize's implicit transactions (`Sequelize.useCLS`), backed by
 * `AsyncLocalStorage`. A nested call joins the transaction already open rather
 * than opening a second one, so a function that is atomic on its own stays
 * atomic when composed into a larger write.
 *
 * CLS is enabled process-wide on the first call, which means every managed
 * `sequelize.transaction(fn)` from then on also propagates implicitly.
 */
export const atomically = async <T>({
  sequelize,
  fn,
}: AtomicallyOptions<T>): Promise<T> => {
  const cls = enableCls(sequelize);

  if (cls.get('transaction')) {
    return fn();
  }

  return sequelize.transaction(() => {
    return fn();
  });
};
