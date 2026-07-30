import * as React from 'react';

import type { Member, Plan, Role } from './data';
import { INITIAL_MEMBERS } from './data';

/**
 * Workspace store — in-memory state the flows mutate (team roster, active
 * plan). Session-scoped by design: reloading resets the fiction to its
 * initial state.
 */

/** Workspace-wide settings the Settings page edits. */
export interface WorkspaceSettings {
  name: string;
  slug: string;
  region: string;
  timezone: string;
  description: string;
  requireReview: boolean;
  enforceTwoFactor: boolean;
}

interface WorkspaceState {
  members: Member[];
  planId: Plan['id'];
  settings: WorkspaceSettings;
  /** The card on file, or null before one is added (Billing's wizard). */
  paymentMethod: { last4: string } | null;
}

const INITIAL_SETTINGS: WorkspaceSettings = {
  name: 'northline',
  slug: 'northline',
  region: 'eu-west',
  timezone: 'Europe/Lisbon',
  description: 'Deploys for the northline product team.',
  requireReview: true,
  enforceTwoFactor: false,
};

let state: WorkspaceState = {
  members: INITIAL_MEMBERS,
  planId: 'pro',
  settings: INITIAL_SETTINGS,
  paymentMethod: null,
};

const listeners = new Set<() => void>();

const setState = (next: WorkspaceState) => {
  state = next;
  for (const listener of listeners) {
    listener();
  }
};

let invitedCount = 0;

export const inviteMember = ({
  email,
  role,
  timezone,
}: {
  email: string;
  role: Role;
  timezone: string;
}) => {
  invitedCount += 1;
  const localPart = email.split('@')[0];
  const name = localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' ');
  const member: Member = {
    id: `mem_invited_${invitedCount}`,
    name: name || email,
    email,
    role,
    timezone,
    joined: 'Invited',
  };
  setState({ ...state, members: [...state.members, member] });
};

export const removeMember = ({ id }: { id: string }) => {
  setState({
    ...state,
    members: state.members.filter((member) => {
      return member.id !== id;
    }),
  });
};

export const setPlan = ({ planId }: { planId: Plan['id'] }) => {
  setState({ ...state, planId });
};

export const setPaymentMethod = ({ last4 }: { last4: string }) => {
  setState({ ...state, paymentMethod: { last4 } });
};

export const saveSettings = (settings: WorkspaceSettings) => {
  setState({ ...state, settings });
};

/** Test-only: restore the initial fiction between tests. */
export const resetWorkspace = () => {
  invitedCount = 0;
  setState({
    members: INITIAL_MEMBERS,
    planId: 'pro',
    settings: INITIAL_SETTINGS,
    paymentMethod: null,
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => {
  return state;
};

/** Reactive workspace state — re-renders on roster/plan changes. */
export const useWorkspace = (): WorkspaceState => {
  return React.useSyncExternalStore(subscribe, getSnapshot);
};
