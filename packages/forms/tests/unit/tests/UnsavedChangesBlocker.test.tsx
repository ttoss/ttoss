import { render, screen, userEvent, waitFor } from '@ttoss/test-utils/react';
import { Button } from '@ttoss/ui';
import {
  createMemoryRouter,
  Outlet,
  RouterProvider,
  useNavigate,
} from 'react-router-dom';

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
      Leave
    </Button>
  );
};

const Layout = () => {
  return <Outlet />;
};

const OtherPage = () => {
  return <div>Other Page</div>;
};

const FormWithBlocker = ({
  warnOnUnsavedChanges = true,
}: {
  warnOnUnsavedChanges?: boolean;
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

const renderWithRouter = (warnOnUnsavedChanges = true) => {
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

    renderWithRouter(true);

    await user.click(screen.getByText('Leave'));

    expect(screen.getByText('Other Page')).toBeInTheDocument();
  });

  test('blocks navigation and shows modal when form is dirty', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(true);

    await user.type(screen.getByLabelText('First Name'), 'John');

    await user.click(screen.getByText('Leave'));

    await waitFor(() => {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'You have unsaved changes. If you leave now, they will be discarded.'
      )
    ).toBeInTheDocument();
  });

  test('allows navigation when user confirms discard', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(true);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText('Leave'));

    await waitFor(() => {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Discard'));

    await waitFor(() => {
      expect(screen.getByText('Other Page')).toBeInTheDocument();
    });
  });

  test('stays on page when user chooses keep editing', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(true);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText('Leave'));

    await waitFor(() => {
      expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Keep editing'));

    await waitFor(() => {
      expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.queryByText('Other Page')).not.toBeInTheDocument();
  });

  test('does not block when warnOnUnsavedChanges is false', async () => {
    const user = userEvent.setup({ delay: null });

    renderWithRouter(false);

    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.click(screen.getByText('Leave'));

    expect(screen.getByText('Other Page')).toBeInTheDocument();
    expect(screen.queryByText('Discard changes?')).not.toBeInTheDocument();
  });

  test('registers beforeunload listener when dirty', async () => {
    const user = userEvent.setup({ delay: null });
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    renderWithRouter(true);

    expect(addSpy).not.toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );

    await user.type(screen.getByLabelText('First Name'), 'John');

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    });

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
