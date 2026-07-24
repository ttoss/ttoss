import { act, renderHook } from '@testing-library/react';
import { INITIAL_MEMBERS } from 'src/data';
import {
  inviteMember,
  removeMember,
  resetWorkspace,
  setPlan,
  useWorkspace,
} from 'src/store';

beforeEach(() => {
  resetWorkspace();
});

describe('workspace store', () => {
  test('starts with the initial fiction', () => {
    const { result } = renderHook(() => {
      return useWorkspace();
    });
    expect(result.current.members).toHaveLength(INITIAL_MEMBERS.length);
    expect(result.current.planId).toBe('pro');
  });

  test('inviteMember derives a display name from the email local part', () => {
    const { result } = renderHook(() => {
      return useWorkspace();
    });

    act(() => {
      inviteMember({ email: 'joao.pereira@northline.dev', role: 'Viewer' });
    });

    const invited = result.current.members.at(-1);
    expect(invited).toMatchObject({
      name: 'Joao Pereira',
      email: 'joao.pereira@northline.dev',
      role: 'Viewer',
      joined: 'Invited',
    });
  });

  test('inviteMember falls back to the raw email when no name derives', () => {
    const { result } = renderHook(() => {
      return useWorkspace();
    });

    act(() => {
      inviteMember({ email: '@northline.dev', role: 'Viewer' });
    });

    expect(result.current.members.at(-1)?.name).toBe('@northline.dev');
  });

  test('removeMember drops the member by id', () => {
    const { result } = renderHook(() => {
      return useWorkspace();
    });

    act(() => {
      removeMember({ id: INITIAL_MEMBERS[0].id });
    });

    expect(result.current.members).toHaveLength(INITIAL_MEMBERS.length - 1);
    expect(
      result.current.members.some((member) => {
        return member.id === INITIAL_MEMBERS[0].id;
      })
    ).toBe(false);
  });

  test('setPlan switches the active plan', () => {
    const { result } = renderHook(() => {
      return useWorkspace();
    });

    act(() => {
      setPlan({ planId: 'scale' });
    });

    expect(result.current.planId).toBe('scale');
  });
});
