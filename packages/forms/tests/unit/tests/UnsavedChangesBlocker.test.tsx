import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useBlocker,
  useNavigate,
} from 'react-router-dom';

import type {
  UseRouterBlockerFn,
  WarnOnUnsavedChangesOptions,
} from '../../../src';
import { Form, FormFieldInput, useForm } from '../../../src';

// react-router-dom v6 requires Request/Response globals which jsdom lacks
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    url: string;
    method: string;
    signal: AbortSignal;
    constructor(url: string, init?: { method?: string; signal?: AbortSignal }) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.signal = init?.signal || new AbortController().signal;
    }
  } as unknown as typeof globalThis.Request;
}
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    body = null;
    status = 200;
    ok = true;
  } as unknown as typeof globalThis.Response;
}

const reactRouterWarnOnUnsavedChanges = {
  useRouterBlocker: useBlocker as unknown as UseRouterBlockerFn,
} satisfies WarnOnUnsavedChangesOptions;

const leaveLabel = 'Leave';
const otherPageLabel = 'Other Page';

const onSubmit = jest.fn();

const NavigateButton = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  return (
    <Button
      type="button"
      onClick={() => {
        navigate(to);
      }}
    >
      {leaveLabel}
    </Button>
  );
};

const Layout = () => {
  return <Outlet />;
};

const OtherPage = () => {
  return <div>{otherPageLabel}</div>;
};

const FormWithBlocker = ({
  warnOnUnsavedChanges = true,
}: {
  warnOnUnsavedChanges?: boolean | WarnOnUnsavedChangesOptions;
}) => {
  const formMethods = useForm({
    defaultValues: { firstName: '' },
  });

  return (
    <Form
      {...formMethods}
      onSubmit={onSubmit}
      warnOnUnsavedChanges={warnOnUnsavedChanges}
    >
      <FormFieldInput name="firstName" label="First Name" />
      <NavigateButton to="/other" />
    </Form>
  );
};

const renderWithRouter = (
  warnOnUnsavedChanges: boolean | WarnOnUnsavedChangesOptions = true
) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            index: true,
            element: (
              <FormWithBlocker warnOnUnsavedChanges={warnOnUnsavedChanges} />
            ),
          },
          { path: 'other', element: <OtherPage /> },
        ],
      },
    ],
    { initialEntries: ['/'] }
  );

  return render(<RouterProvider router={router} />);
};

beforeEach(() => {
  onSubmit.mockClear();
});

describe('warnOnUnsavedChanges', () => {
  test('does not block navigation when form is pristine', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(reactRouterWarnOnUnsavedChanges);

    await user.click(screen.getByText(leaveLabel));

    expect(screen.getByText(otherPageLabel)).toBeInTheDocument();
  });

  test('blocks navigation and shows modal when form is dirty', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(reactRouterWarnOnUnsavedChanges);

    await user.type(screen.getByLabelText('First Name'), 'John');

    await user.click(screen.getByText(leaveLabel));

    await waitFor(() => {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'You have unsaved changes. If you leave now, they will be discarded.'
      )
    ).toBeInTheDocument();
  });

  test('renders custom modal copy when warnOnUnsavedChanges receives overrides', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter({
      ...reactRouterWarnOnUnsavedChanges,
      title: 'Leave this profile form?',
      description: 'Your current draft will be lost if you continue.',
      confirmLabel: 'Leave without saving',
      cancelLabel: 'Continue editing',
    });

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText(leaveLabel));

    await waitFor(() => {
      expect(screen.getByText('Leave this profile form?')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Your current draft will be lost if you continue.')
    ).toBeInTheDocument();
    expect(screen.getByText('Leave without saving')).toBeInTheDocument();
    expect(screen.getByText('Continue editing')).toBeInTheDocument();
  });

  test('allows navigation when user confirms discard', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(reactRouterWarnOnUnsavedChanges);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText(leaveLabel));

    await waitFor(() => {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Discard'));

    await waitFor(() => {
      expect(screen.getByText(otherPageLabel)).toBeInTheDocument();
    });
  });

  test('stays on page when user chooses keep editing', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(reactRouterWarnOnUnsavedChanges);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText(leaveLabel));

    await waitFor(() => {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Keep editing'));

    await waitFor(() => {
      expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.queryByText(otherPageLabel)).not.toBeInTheDocument();
  });

  test('does not block when warnOnUnsavedChanges is false', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(false);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText(leaveLabel));

    expect(screen.getByText(otherPageLabel)).toBeInTheDocument();
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
  });

  test('does not block in-app navigation without a router blocker hook', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(true);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText(leaveLabel));

    expect(screen.getByText(otherPageLabel)).toBeInTheDocument();
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
  });

  test('fails open when the injected router blocker throws', async () => {
    const user = userEvent.setup({ delay: null });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    renderWithRouter({
      useRouterBlocker: () => {
        throw new Error('router unavailable');
      },
    });

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText(leaveLabel));

    expect(screen.getByText(otherPageLabel)).toBeInTheDocument();
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('registers beforeunload listener when dirty', async () => {
    const user = userEvent.setup({ delay: null });
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    renderWithRouter(reactRouterWarnOnUnsavedChanges);

    expect(addSpy).not.toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    await user.type(screen.getByLabelText('First Name'), 'John');

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    const beforeUnloadCall = addSpy.mock.calls.find(([eventName]) => {
      return eventName === 'beforeunload';
    });
    expect(beforeUnloadCall).toBeDefined();

    const beforeUnloadHandler = beforeUnloadCall?.[1];
    expect(typeof beforeUnloadHandler).toBe('function');

    if (typeof beforeUnloadHandler === 'function') {
      const event = {
        preventDefault: jest.fn(),
      } as unknown as BeforeUnloadEvent;

      beforeUnloadHandler(event);

      expect(event.preventDefault).toHaveBeenCalled();
    }

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
