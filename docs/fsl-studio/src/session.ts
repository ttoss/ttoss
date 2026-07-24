import * as React from 'react';

/**
 * Session layer — Meridian's sign-in is a real entry gate: the login form
 * validates for real and any credentials that pass validation create a
 * session (BLUEPRINT S2). The session lives in `sessionStorage`, so a
 * browser tab behaves like an authenticated app session.
 */

const SESSION_KEY = 'meridian.session';

export interface Session {
  email: string;
}

const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) {
    listener();
  }
};

let cachedRaw: string | null = null;
let cachedSession: Session | null = null;

export const getSession = (): Session | null => {
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (raw === cachedRaw) {
    return cachedSession;
  }
  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return null;
  }
  try {
    cachedSession = JSON.parse(raw) as Session;
  } catch {
    cachedSession = null;
  }
  return cachedSession;
};

export const signIn = ({ email }: { email: string }) => {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  notify();
};

export const signOut = () => {
  window.sessionStorage.removeItem(SESSION_KEY);
  notify();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Reactive session state — re-renders on sign-in/sign-out. */
export const useSession = (): Session | null => {
  return React.useSyncExternalStore(subscribe, getSession);
};
