import { I18nProvider } from '@ttoss/react-i18n';
import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import {
  GeovisWorkspace,
  GeovisWorkspaceProvider,
  type GeovisWorkspaceSpec,
  useGeovisWorkspace,
} from 'src';

const Provider = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider>{children}</I18nProvider>;
};

const spec: GeovisWorkspaceSpec = {
  leftSidebar: {
    menus: [
      {
        id: 'population',
        title: 'População',
        items: [
          { value: '5year-65plus', label: 'Faixa (% da pop 65+)' },
          { value: '0-14', label: '0 a 14 anos' },
        ],
      },
      {
        id: 'economy',
        title: 'Economia',
        items: [
          { value: 'gdp', label: 'PIB' },
          { value: 'income', label: 'Renda média' },
        ],
      },
    ],
  },
  rightSidebar: {},
};

const openLeftSidebar = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  });
};

test('renders children inside the main content area', () => {
  render(
    <GeovisWorkspace spec={spec}>
      <div>Map Content</div>
    </GeovisWorkspace>,
    { wrapper: Provider }
  );

  expect(screen.getByText('Map Content')).toBeInTheDocument();
});

test('left sidebar is closed by default and shows the open button', () => {
  render(<GeovisWorkspace spec={spec} />, { wrapper: Provider });

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
});

test('clicking the open button reveals the menu groups and items', async () => {
  render(<GeovisWorkspace spec={spec} />, { wrapper: Provider });

  await openLeftSidebar();

  expect(screen.getByText('População')).toBeInTheDocument();
  expect(screen.getByText('Economia')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'PIB' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument();
});

test('closing the left sidebar brings the open button back', async () => {
  render(<GeovisWorkspace spec={spec} />, { wrapper: Provider });

  await openLeftSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  });

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
});

test('selecting an item marks it active without affecting other groups', async () => {
  render(<GeovisWorkspace spec={spec} />, { wrapper: Provider });

  await openLeftSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'PIB' }));
  });

  expect(screen.getByRole('button', { name: 'PIB' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(
    screen.getByRole('button', { name: 'Faixa (% da pop 65+)' })
  ).toHaveAttribute('aria-pressed', 'false');
});

test('calls onSelect with the menu id and value', async () => {
  const onSelect = jest.fn();

  render(<GeovisWorkspace spec={spec} onSelect={onSelect} />, {
    wrapper: Provider,
  });

  await openLeftSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Renda média' }));
  });

  expect(onSelect).toHaveBeenCalledWith({
    menuId: 'economy',
    value: 'income',
  });
});

test('initializes selection from defaultValue', async () => {
  const specWithDefault: GeovisWorkspaceSpec = {
    leftSidebar: {
      menus: [
        {
          id: 'economy',
          title: 'Economia',
          defaultValue: 'gdp',
          items: [
            { value: 'gdp', label: 'PIB' },
            { value: 'income', label: 'Renda média' },
          ],
        },
      ],
    },
  };

  render(<GeovisWorkspace spec={specWithDefault} />, { wrapper: Provider });

  await openLeftSidebar();

  expect(screen.getByRole('button', { name: 'PIB' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('right sidebar renders only when defined in the spec', () => {
  const { rerender } = render(
    <GeovisWorkspace spec={{ leftSidebar: spec.leftSidebar }} />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();

  rerender(<GeovisWorkspace spec={spec} />);

  expect(
    screen.getByRole('button', { name: 'Open details' })
  ).toBeInTheDocument();
});

test('left sidebar controls are absent when leftSidebar is undefined', () => {
  render(<GeovisWorkspace spec={{ rightSidebar: {} }} />, {
    wrapper: Provider,
  });

  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument();
});

test('right sidebar shows the selected item and a custom title', async () => {
  render(
    <GeovisWorkspace spec={{ ...spec, rightSidebar: { title: 'Camadas' } }} />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'PIB' }));
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open details' }));
  });

  expect(screen.getByText('Camadas')).toBeInTheDocument();
  expect(
    screen.queryByText('Select an item to view details.')
  ).not.toBeInTheDocument();
});

test('useGeovisWorkspace throws when used outside provider', () => {
  const BrokenComponent = () => {
    useGeovisWorkspace();
    return null;
  };

  expect(() => {
    render(<BrokenComponent />, { wrapper: Provider });
  }).toThrow(
    'useGeovisWorkspace must be used within a GeovisWorkspaceProvider'
  );
});

test('GeovisWorkspaceProvider exposes context to consumers', () => {
  const Consumer = () => {
    const { selection } = useGeovisWorkspace();
    return <div>{selection.population ?? 'none'}</div>;
  };

  render(
    <GeovisWorkspaceProvider spec={spec}>
      <Consumer />
    </GeovisWorkspaceProvider>,
    { wrapper: Provider }
  );

  expect(screen.getByText('none')).toBeInTheDocument();
});
