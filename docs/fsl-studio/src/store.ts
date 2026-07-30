import * as React from 'react';

import type { Environment, Member, Plan, Role } from './data';
import { INITIAL_ENVIRONMENTS, INITIAL_MEMBERS } from './data';

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
  environments: Environment[];
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
  environments: INITIAL_ENVIRONMENTS,
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

/**
 * How long the fictional backend takes to answer a create call. Real enough
 * for the pending state to be visible, short enough for tests to await it.
 */
export const CREATE_DELAY_MS = 350;

let createdCount = 0;

/**
 * Creates an environment on the fictional backend — the async half of the
 * forms story: the submit button rides `isPending` while this resolves, and a
 * duplicate name rejects with a **server** message the caller feeds back to
 * the form as `validationErrors` (React Aria routes it to the field by
 * `name`). Client-side validation cannot know what already exists; this is
 * the one refusal only a server can issue.
 */
export const createEnvironment = (
  environment: Omit<Environment, 'id'>
): Promise<Environment> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const taken = state.environments.some((existing) => {
        return existing.name === environment.name;
      });
      if (taken) {
        reject(
          new Error(
            `An environment named "${environment.name}" already exists.`
          )
        );
        return;
      }
      createdCount += 1;
      const created: Environment = {
        ...environment,
        id: `env_${createdCount}`,
      };
      setState({ ...state, environments: [...state.environments, created] });
      resolve(created);
    }, CREATE_DELAY_MS);
  });
};

/** Test-only: restore the initial fiction between tests. */
export const resetWorkspace = () => {
  invitedCount = 0;
  createdCount = 0;
  setState({
    members: INITIAL_MEMBERS,
    planId: 'pro',
    settings: INITIAL_SETTINGS,
    paymentMethod: null,
    environments: INITIAL_ENVIRONMENTS,
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
