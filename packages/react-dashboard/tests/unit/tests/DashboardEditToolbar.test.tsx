import { fireEvent, render, screen } from '@ttoss/test-utils/react';
import { DashboardEditToolbar } from 'src/DashboardEditToolbar';
import { useDashboard } from 'src/DashboardProvider';

jest.mock('src/DashboardProvider', () => {
  const actual = jest.requireActual('src/DashboardProvider');
  return {
    ...actual,
    useDashboard: jest.fn(),
  };
});

jest.mock('@ttoss/components/Drawer', () => {
  return {
    Drawer: ({
      open,
      children,
      onClose,
    }: {
      open: boolean;
      children: React.ReactNode;
      onClose: () => void;
    }) => {
      if (!open) return null;
      return (
        <div>
          <button onClick={onClose}>Close drawer</button>
          {children}
        </div>
      );
    },
  };
});

jest.mock('@ttoss/components/Search', () => {
  return {
    Search: ({
      onChange,
      placeholder,
    }: {
      onChange: (value: string) => void;
      placeholder: string;
    }) => {
      return (
        <input
          aria-label="Search cards"
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      );
    },
  };
});

describe('DashboardEditToolbar', () => {
  const startEdit = jest.fn();
  const cancelEdit = jest.fn();
  const saveEdit = jest.fn();
  const saveAsNew = jest.fn();
  const confirmSaveAsNew = jest.fn();
  const cancelSaveAsNew = jest.fn();
  const addCard = jest.fn();

  const mockUseDashboard = useDashboard as jest.MockedFunction<
    typeof useDashboard
  >;

  const buildDashboardState = (overrides: Record<string, unknown> = {}) => {
    return {
      editable: true,
      isEditMode: false,
      selectedTemplate: {
        id: 'template-1',
        name: 'Main Template',
        editable: true,
        grid: [],
      },
      cardCatalog: [
        {
          w: 4,
          h: 2,
          card: {
            title: 'Meta metric',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'meta' }],
            data: {},
          },
        },
        {
          w: 4,
          h: 2,
          card: {
            title: 'API metric',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {},
          },
        },
        {
          w: 4,
          h: 2,
          card: {
            title: 'OCA metric',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'oneclickads' }],
            data: {},
          },
        },
        {
          w: 4,
          h: 2,
          card: {
            title: 'Fallback metric',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [],
            data: {},
          },
        },
        {
          w: 12,
          h: 1,
          card: {
            type: 'sectionDivider',
            title: 'Section title',
          },
        },
      ],
      startEdit,
      cancelEdit,
      saveEdit,
      saveAsNew,
      saveAsNewModalOpen: false,
      confirmSaveAsNew,
      cancelSaveAsNew,
      addCard,
      ...overrides,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboard.mockReturnValue(buildDashboardState() as never);
  });

  test('should not render when dashboard is not editable', () => {
    mockUseDashboard.mockReturnValue(
      buildDashboardState({
        editable: false,
      }) as never
    );

    const { container } = render(<DashboardEditToolbar />);

    expect(container.firstChild).toBeNull();
  });

  test('should render edit button and start edit mode', () => {
    render(<DashboardEditToolbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(startEdit).toHaveBeenCalledTimes(1);
  });

  test('should render edit controls and save only for editable template', () => {
    mockUseDashboard.mockReturnValue(
      buildDashboardState({
        isEditMode: true,
      }) as never
    );

    render(<DashboardEditToolbar />);

    expect(
      screen.getByRole('button', { name: 'Adicionar item' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Salvar como novo' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Cancelar edição' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar como novo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar edição' }));

    expect(saveEdit).toHaveBeenCalledTimes(1);
    expect(saveAsNew).toHaveBeenCalledTimes(1);
    expect(cancelEdit).toHaveBeenCalledTimes(1);
  });

  test('should hide save button when selected template is not editable', () => {
    mockUseDashboard.mockReturnValue(
      buildDashboardState({
        isEditMode: true,
        selectedTemplate: {
          id: 'template-2',
          name: 'Read-only Template',
          editable: false,
          grid: [],
        },
      }) as never
    );

    render(<DashboardEditToolbar />);

    expect(
      screen.queryByRole('button', { name: 'Salvar' })
    ).not.toBeInTheDocument();
  });

  test('should open drawer, group cards and add by click', () => {
    mockUseDashboard.mockReturnValue(
      buildDashboardState({
        isEditMode: true,
      }) as never
    );

    render(<DashboardEditToolbar />);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));

    expect(screen.getByText('Divisor de seção')).toBeInTheDocument();
    expect(screen.getByText('Meta')).toBeInTheDocument();
    expect(screen.getByText('OneClickAds')).toBeInTheDocument();
    expect(screen.getAllByText('API')).toHaveLength(1);

    fireEvent.click(screen.getByText('Fallback metric'));

    expect(addCard).toHaveBeenCalledTimes(1);
  });

  test('should filter cards by search and add by keyboard', () => {
    mockUseDashboard.mockReturnValue(
      buildDashboardState({
        isEditMode: true,
      }) as never
    );

    render(<DashboardEditToolbar />);
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar item' }));

    fireEvent.change(screen.getByLabelText('Search cards'), {
      target: { value: 'meta' },
    });

    expect(screen.getByText('Meta metric')).toBeInTheDocument();
    expect(screen.queryByText('API metric')).not.toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByText('Meta metric').closest('[role="button"]'),
      {
        key: 'Enter',
      }
    );

    expect(addCard).toHaveBeenCalledTimes(1);
  });

  test('should render save-as-new modal and submit title', () => {
    mockUseDashboard.mockReturnValue(
      buildDashboardState({
        isEditMode: true,
        saveAsNewModalOpen: true,
      }) as never
    );

    render(<DashboardEditToolbar />);

    const titleInput = screen.getByLabelText('Título do template');
    expect(titleInput).toHaveValue('Clone de Main Template');

    fireEvent.change(titleInput, {
      target: { value: '  ' },
    });
    expect(screen.getAllByRole('button', { name: 'Salvar' })[1]).toBeDisabled();

    fireEvent.change(titleInput, {
      target: { value: 'Copied Template' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(confirmSaveAsNew).toHaveBeenCalledWith('Copied Template');
    expect(cancelSaveAsNew).toHaveBeenCalledTimes(1);
  });
});
