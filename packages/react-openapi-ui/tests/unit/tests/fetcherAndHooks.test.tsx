import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from '@ttoss/test-utils/react';

import {
  createFetcher,
  OpenApiProvider,
  OpenApiRequestError,
  OpenApiTable,
  useOpenApi,
  useOperationMutation,
  useOperationQuery,
} from '../../../src';
import { spec } from '../fixtures';
import { createFakeApi } from './fakeApi';

const mockFetch = (status: number, text: string) => {
  const fetchMock = jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    text: () => {
      return Promise.resolve(text);
    },
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

describe('createFetcher', () => {
  test('sends JSON with base URL and headers', async () => {
    const fetchMock = mockFetch(200, '{"ok":true}');
    const fetcher = createFetcher({
      baseUrl: 'https://api.test/',
      headers: async () => {
        return { Authorization: 'Bearer t' };
      },
    });
    await expect(
      fetcher({ method: 'post', url: '/clients', body: { a: 1 } })
    ).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('https://api.test/clients', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: 'Bearer t',
      },
      body: '{"a":1}',
      signal: undefined,
    });
  });

  test('sends FormData as is and keeps non-JSON and empty bodies', async () => {
    const fetchMock = mockFetch(200, 'plain');
    const formData = new FormData();
    await expect(
      createFetcher({ headers: { X: '1' } })({
        method: 'post',
        url: '/u',
        body: formData,
      })
    ).resolves.toBe('plain');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      headers: { Accept: 'application/json', X: '1' },
      body: formData,
    });
    mockFetch(204, '');
    await expect(
      createFetcher()({ method: 'delete', url: '/x' })
    ).resolves.toBeUndefined();
  });

  test('rejects with the API message', async () => {
    mockFetch(422, '{"detail":"Bad input"}');
    const error = await createFetcher()({ method: 'get', url: '/x' }).catch(
      (error_) => {
        return error_;
      }
    );
    expect(error).toBeInstanceOf(OpenApiRequestError);
    expect(error).toMatchObject({
      status: 422,
      body: { detail: 'Bad input' },
      message: 'Bad input',
    });
    mockFetch(500, '');
    await expect(createFetcher()({ method: 'get', url: '/x' })).rejects.toThrow(
      'Request failed with status 500'
    );
  });
});

describe('hooks', () => {
  const wrapperFor = (fetcher = createFakeApi().fetcher) => {
    return ({ children }: { children: React.ReactNode }) => {
      return (
        <OpenApiProvider spec={spec} fetcher={fetcher}>
          {children}
        </OpenApiProvider>
      );
    };
  };

  test('useOpenApi requires a provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      return renderHook(() => {
        return useOpenApi();
      });
    }).toThrow('useOpenApi must be used inside an <OpenApiProvider>.');
  });

  test('reloads a spec that failed to load', async () => {
    const api = createFakeApi();
    api.fetcher.mockRejectedValueOnce('offline');
    const { result } = renderHook(
      () => {
        return useOpenApi();
      },
      {
        wrapper: ({ children }) => {
          return (
            <OpenApiProvider specUrl="/openapi.json" fetcher={api.fetcher}>
              {children}
            </OpenApiProvider>
          );
        },
      }
    );
    await waitFor(() => {
      expect(result.current.error?.message).toBe('offline');
    });
    act(() => {
      result.current.reload();
    });
    await waitFor(() => {
      expect(result.current.spec).toEqual(spec);
    });
  });

  test('useOperationQuery reports missing path params and disabled state', async () => {
    const { result } = renderHook(
      () => {
        return useOperationQuery({ operationId: 'getClient' });
      },
      { wrapper: wrapperFor() }
    );
    await waitFor(() => {
      expect(result.current.error?.message).toMatch('Missing path parameter');
    });
    const disabled = renderHook(
      () => {
        return useOperationQuery({ operationId: 'nope', enabled: false });
      },
      { wrapper: wrapperFor() }
    );
    expect(disabled.result.current).toMatchObject({
      error: null,
      loading: false,
    });
  });

  test('useOperationQuery wraps non-Error rejections', async () => {
    const api = createFakeApi();
    api.fetcher.mockRejectedValueOnce('down');
    const { result } = renderHook(
      () => {
        return useOperationQuery({ operationId: 'listClients' });
      },
      { wrapper: wrapperFor(api.fetcher) }
    );
    await waitFor(() => {
      expect(result.current.error?.message).toBe('down');
    });
  });

  test('useOperationMutation sends requests and resets', async () => {
    const api = createFakeApi();
    const { result } = renderHook(
      () => {
        return useOperationMutation({ operationId: 'deleteClient' });
      },
      { wrapper: wrapperFor(api.fetcher) }
    );
    await act(async () => {
      await result.current.mutate({ params: { client_id: 'c1' } });
    });
    expect(api.requests.at(-1)).toMatchObject({
      method: 'delete',
      url: '/clients/c1',
    });
    api.fetcher.mockRejectedValueOnce('nope');
    await act(async () => {
      await expect(
        result.current.mutate({ params: { client_id: 'c2' } })
      ).rejects.toBe('nope');
    });
    expect(result.current.error?.message).toBe('nope');
    act(() => {
      result.current.reset();
    });
    expect(result.current.error).toBeNull();
  });

  test('useOperationMutation rejects unknown operations', async () => {
    const { result } = renderHook(
      () => {
        return useOperationMutation({ operationId: 'nope' });
      },
      { wrapper: wrapperFor() }
    );
    await expect(result.current.mutate()).rejects.toThrow(
      'Operation "nope" not found in the OpenAPI spec.'
    );
  });
});

const OpenApiTableAll = () => {
  return (
    <OpenApiTable
      operationId="listClients"
      columns={['created_at', 'tags', 'address', 'api_key', 'vip']}
    />
  );
};

test('cell values cover dates, lists and records in a table', async () => {
  render(
    <OpenApiProvider spec={spec} fetcher={createFakeApi().fetcher}>
      <OpenApiTableAll />
    </OpenApiProvider>
  );
  expect(await screen.findByText('Recife · PE')).toBeInTheDocument();
  expect(screen.getByText('silver')).toBeInTheDocument();
  expect(screen.getAllByText('Hidden')).toHaveLength(3);
});

test('formats dates and truncates JSON and long text in cells', async () => {
  const api = createFakeApi();
  api.fetcher.mockResolvedValueOnce([
    {
      id: 'x',
      birth_date: '1990-05-17',
      notes: 'a'.repeat(100),
      meta: { nested: { deep: true } },
    },
  ]);
  render(
    <OpenApiProvider spec={spec} fetcher={api.fetcher}>
      <OpenApiTable
        operationId="listClients"
        columns={['birth_date', 'notes', 'meta']}
      />
    </OpenApiProvider>
  );
  expect(await screen.findByText('May 17, 1990')).toBeInTheDocument();
  expect(screen.getByTitle('a'.repeat(100))).toHaveTextContent(/…$/);
  expect(screen.getByText('{"nested":{"deep":true}}')).toBeInTheDocument();
});
