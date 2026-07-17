import { fireEvent, render, screen } from '@ttoss/test-utils/react';
import {
  Dashboard,
  type DashboardCardProps,
  type DashboardFilter,
  DashboardFilterType,
  DashboardGrid,
  DashboardProvider,
  type DashboardTemplate,
} from 'src/index';

describe('DashboardGrid', () => {
  const mockTemplate: DashboardTemplate = {
    id: 'template-1',
    name: 'Test Template',
    grid: [
      {
        i: 'card-1',
        x: 0,
        y: 0,
        w: 4,
        h: 2,
        card: {
          title: 'Card 1',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: { value: 100 },
        },
      },
      {
        i: 'card-2',
        x: 4,
        y: 0,
        w: 4,
        h: 2,
        card: {
          title: 'Card 2',
          numberType: 'number',
          type: 'bigNumber',
          sourceType: [{ source: 'api' }],
          data: { value: 200 },
        },
      },
    ],
  };

  const mockFilters: DashboardFilter[] = [
    {
      key: 'template',
      type: DashboardFilterType.SELECT,
      label: 'Template',
      value: 'template-1',
    },
  ];

  test('should render loading spinner when loading is true', () => {
    render(
      <DashboardProvider
        filters={mockFilters}
        templates={[mockTemplate]}
        selectedTemplate={mockTemplate}
      >
        <DashboardGrid loading={true} selectedTemplate={mockTemplate} />
      </DashboardProvider>
    );

    // Spinner should be rendered
    expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
  });

  test('should render cards when loading is false and template is selected', () => {
    render(
      <DashboardProvider
        filters={mockFilters}
        templates={[mockTemplate]}
        selectedTemplate={mockTemplate}
      >
        <DashboardGrid loading={false} selectedTemplate={mockTemplate} />
      </DashboardProvider>
    );

    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });

  test('should return null when no template is selected', () => {
    const { container } = render(
      <DashboardProvider
        filters={[]}
        templates={[mockTemplate]}
        selectedTemplate={undefined}
      >
        <DashboardGrid loading={false} selectedTemplate={undefined} />
      </DashboardProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  test('should render empty grid when template has no cards', () => {
    const emptyTemplate: DashboardTemplate = {
      id: 'empty-template',
      name: 'Empty Template',
      grid: [],
    };

    const emptyFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'empty-template',
      },
    ];

    render(
      <DashboardProvider
        filters={emptyFilters}
        templates={[emptyTemplate]}
        selectedTemplate={emptyTemplate}
      >
        <DashboardGrid loading={false} selectedTemplate={emptyTemplate} />
      </DashboardProvider>
    );

    // Grid should render but with no cards
    expect(screen.queryByText('Card 1')).not.toBeInTheDocument();
  });

  test('should render section divider when card type is sectionDivider', () => {
    const templateWithDivider: DashboardTemplate = {
      id: 'template-with-divider',
      name: 'Template with Divider',
      grid: [
        {
          i: 'divider-1',
          x: 0,
          y: 0,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Performance Metrics',
          },
        },
      ],
    };

    const emptyFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'template-with-divider',
      },
    ];

    render(
      <DashboardProvider
        filters={emptyFilters}
        templates={[templateWithDivider]}
        selectedTemplate={templateWithDivider}
      >
        <DashboardGrid loading={false} selectedTemplate={templateWithDivider} />
      </DashboardProvider>
    );

    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  test('should render both cards and section dividers in the same grid', () => {
    const templateWithMixed: DashboardTemplate = {
      id: 'template-mixed',
      name: 'Template with Mixed Content',
      grid: [
        {
          i: 'card-1',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            title: 'Revenue',
            numberType: 'currency',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 1000 },
          },
        },
        {
          i: 'divider-1',
          x: 0,
          y: 2,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Performance Metrics',
          },
        },
        {
          i: 'card-2',
          x: 0,
          y: 4,
          w: 4,
          h: 2,
          card: {
            title: 'ROAS',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 3.5 },
          },
        },
      ],
    };

    const emptyFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'template-mixed',
      },
    ];

    render(
      <DashboardProvider
        filters={emptyFilters}
        templates={[templateWithMixed]}
        selectedTemplate={templateWithMixed}
      >
        <DashboardGrid loading={false} selectedTemplate={templateWithMixed} />
      </DashboardProvider>
    );

    // Should render both cards and divider
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('ROAS')).toBeInTheDocument();
  });

  test('should render multiple section dividers', () => {
    const templateWithDividers: DashboardTemplate = {
      id: 'template-multiple-dividers',
      name: 'Template with Multiple Dividers',
      grid: [
        {
          i: 'divider-1',
          x: 0,
          y: 0,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Revenue Metrics',
          },
        },
        {
          i: 'divider-2',
          x: 0,
          y: 2,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Performance Metrics',
          },
        },
        {
          i: 'divider-3',
          x: 0,
          y: 4,
          w: 12,
          h: 2,
          card: {
            type: 'sectionDivider',
            title: 'Engagement Metrics',
          },
        },
      ],
    };

    const emptyFilters: DashboardFilter[] = [
      {
        key: 'template',
        type: DashboardFilterType.SELECT,
        label: 'Template',
        value: 'template-multiple-dividers',
      },
    ];

    render(
      <DashboardProvider
        filters={emptyFilters}
        templates={[templateWithDividers]}
        selectedTemplate={templateWithDividers}
      >
        <DashboardGrid
          loading={false}
          selectedTemplate={templateWithDividers}
        />
      </DashboardProvider>
    );

    expect(screen.getByText('Revenue Metrics')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
  });

  describe('renderCardDetail', () => {
    const detailTemplate: DashboardTemplate = {
      id: 'detail-template',
      name: 'Detail Template',
      grid: [
        {
          i: 'card-1',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            id: 'card-1',
            title: 'Card 1',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 100 },
          },
        },
        {
          i: 'card-2',
          x: 4,
          y: 0,
          w: 4,
          h: 2,
          card: {
            id: 'card-2',
            title: 'Card 2',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 200 },
          },
        },
      ],
    };

    const renderDetail = (card: DashboardCardProps, close: () => void) => {
      return (
        <div>
          <span>Detail: {card.title}</span>
          <button onClick={close}>Close</button>
        </div>
      );
    };

    test('should render detail slot when a clickable card is clicked', () => {
      render(
        <Dashboard
          selectedTemplate={detailTemplate}
          templates={[detailTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
        />
      );

      // Click the first card (role=button wrapping the card)
      const allButtons = screen.getAllByRole('button');
      // The card buttons are role=button; find the one containing Card 1 text
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      expect(card1Button).toBeDefined();
      fireEvent.click(card1Button!);

      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();
    });

    test('should not render detail slot before any card is clicked', () => {
      render(
        <Dashboard
          selectedTemplate={detailTemplate}
          templates={[detailTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
        />
      );

      expect(screen.queryByText(/^Detail:/)).not.toBeInTheDocument();
    });

    test('should toggle slot closed when same card is clicked twice', () => {
      render(
        <Dashboard
          selectedTemplate={detailTemplate}
          templates={[detailTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      expect(card1Button).toBeDefined();

      // First click — slot opens
      fireEvent.click(card1Button!);
      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();

      // Second click on same card — slot closes
      fireEvent.click(card1Button!);
      expect(screen.queryByText('Detail: Card 1')).not.toBeInTheDocument();
    });

    test('should move slot to new card when different card is clicked', () => {
      render(
        <Dashboard
          selectedTemplate={detailTemplate}
          templates={[detailTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      const card2Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 2');
      });
      expect(card1Button).toBeDefined();
      expect(card2Button).toBeDefined();

      // Click card-1 — slot shows Card 1 detail
      fireEvent.click(card1Button!);
      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();
      expect(screen.queryByText('Detail: Card 2')).not.toBeInTheDocument();

      // Click card-2 — slot moves to Card 2
      fireEvent.click(card2Button!);
      expect(screen.getByText('Detail: Card 2')).toBeInTheDocument();
      expect(screen.queryByText('Detail: Card 1')).not.toBeInTheDocument();
    });

    test('should not open slot for cards excluded by clickableCardFilter', () => {
      render(
        <Dashboard
          selectedTemplate={detailTemplate}
          templates={[detailTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
          clickableCardFilter={(card: DashboardCardProps) => {
            return card.title !== 'Card 2';
          }}
        />
      );

      // card-2 should not have role=button
      const allButtons = screen.getAllByRole('button');
      const card2Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 2');
      });
      expect(card2Button).toBeUndefined();

      // No slot rendered
      expect(screen.queryByText(/^Detail:/)).not.toBeInTheDocument();
    });

    test('should not render role=button when renderCardDetail is not provided', () => {
      render(
        <Dashboard
          selectedTemplate={detailTemplate}
          templates={[detailTemplate]}
          filters={[]}
          loading={false}
        />
      );

      // No card wrappers should have role=button (there may be other buttons in the header)
      const allButtons = screen.queryAllByRole('button');
      const cardButton = allButtons.find((b) => {
        return (
          b.textContent?.includes('Card 1') || b.textContent?.includes('Card 2')
        );
      });
      expect(cardButton).toBeUndefined();
    });

    test('should close slot when close callback is called', () => {
      render(
        <Dashboard
          selectedTemplate={detailTemplate}
          templates={[detailTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      expect(card1Button).toBeDefined();

      // Click card — slot opens
      fireEvent.click(card1Button!);
      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();

      // Click the Close button rendered by renderCardDetail
      const closeButton = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeButton);

      expect(screen.queryByText('Detail: Card 1')).not.toBeInTheDocument();
    });
  });

  describe('controlled selectedCardKey', () => {
    const controlledTemplate: DashboardTemplate = {
      id: 'controlled-template',
      name: 'Controlled Template',
      grid: [
        {
          i: 'card-1',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            id: 'card-1',
            title: 'Card 1',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 100 },
          },
        },
        {
          i: 'card-2',
          x: 4,
          y: 0,
          w: 4,
          h: 2,
          card: {
            id: 'card-2',
            title: 'Card 2',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 200 },
          },
        },
      ],
    };

    const renderDetail = (card: DashboardCardProps, close: () => void) => {
      return (
        <div>
          <span>Detail: {card.title}</span>
          <button onClick={close}>Close</button>
        </div>
      );
    };

    test('should display detail for the externally controlled selectedCardKey', () => {
      render(
        <Dashboard
          selectedTemplate={controlledTemplate}
          templates={[controlledTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
          selectedCardKey="card-1"
        />
      );

      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();
    });

    test('should call onCardSelect when a card is clicked in controlled mode', () => {
      const onCardSelect = jest.fn();

      render(
        <Dashboard
          selectedTemplate={controlledTemplate}
          templates={[controlledTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
          selectedCardKey={null}
          onCardSelect={onCardSelect}
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      expect(card1Button).toBeDefined();
      fireEvent.click(card1Button!);

      expect(onCardSelect).toHaveBeenCalledWith(
        'card-1',
        expect.objectContaining({ title: 'Card 1' })
      );
    });

    test('should call onCardSelect with null when the same card is clicked again', () => {
      const onCardSelect = jest.fn();

      render(
        <Dashboard
          selectedTemplate={controlledTemplate}
          templates={[controlledTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
          selectedCardKey="card-1"
          onCardSelect={onCardSelect}
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      expect(card1Button).toBeDefined();
      fireEvent.click(card1Button!);

      expect(onCardSelect).toHaveBeenCalledWith(null, null);
    });
  });

  describe('detailSlotHeight', () => {
    const slotTemplate: DashboardTemplate = {
      id: 'slot-template',
      name: 'Slot Template',
      grid: [
        {
          i: 'card-1',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            id: 'card-1',
            title: 'Card 1',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 100 },
          },
        },
      ],
    };

    const renderDetail = (card: DashboardCardProps, close: () => void) => {
      return (
        <div>
          <span>Detail: {card.title}</span>
          <button onClick={close}>Close</button>
        </div>
      );
    };

    test('should render detail slot with custom height when detailSlotHeight is provided', () => {
      render(
        <Dashboard
          selectedTemplate={slotTemplate}
          templates={[slotTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
          detailSlotHeight={6}
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      expect(card1Button).toBeDefined();
      fireEvent.click(card1Button!);

      // Detail slot should still open regardless of height
      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();
    });
  });

  describe('detailMode multi', () => {
    const multiTemplate: DashboardTemplate = {
      id: 'multi-template',
      name: 'Multi Template',
      grid: [
        {
          i: 'card-1',
          x: 0,
          y: 0,
          w: 4,
          h: 2,
          card: {
            id: 'card-1',
            title: 'Card 1',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 100 },
          },
        },
        {
          i: 'card-2',
          x: 4,
          y: 0,
          w: 4,
          h: 2,
          card: {
            id: 'card-2',
            title: 'Card 2',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: { value: 200 },
          },
        },
      ],
    };

    const renderDetail = (card: DashboardCardProps, close: () => void) => {
      return (
        <div>
          <span>Detail: {card.title}</span>
          <button onClick={close}>Close</button>
        </div>
      );
    };

    test('should allow two cards to be expanded simultaneously in multi mode', () => {
      render(
        <Dashboard
          selectedTemplate={multiTemplate}
          templates={[multiTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
          detailMode="multi"
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      const card2Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 2');
      });
      expect(card1Button).toBeDefined();
      expect(card2Button).toBeDefined();

      fireEvent.click(card1Button!);
      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();
      expect(screen.queryByText('Detail: Card 2')).not.toBeInTheDocument();

      fireEvent.click(card2Button!);
      // Both should now be open
      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();
      expect(screen.getByText('Detail: Card 2')).toBeInTheDocument();
    });

    test('should close individual slots in multi mode when close is called', () => {
      render(
        <Dashboard
          selectedTemplate={multiTemplate}
          templates={[multiTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
          detailMode="multi"
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      const card2Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 2');
      });
      expect(card1Button).toBeDefined();
      expect(card2Button).toBeDefined();

      fireEvent.click(card1Button!);
      fireEvent.click(card2Button!);

      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();
      expect(screen.getByText('Detail: Card 2')).toBeInTheDocument();

      // Close only Card 1
      const closeButtons = screen.getAllByRole('button', { name: 'Close' });
      fireEvent.click(closeButtons[0]);

      expect(screen.queryByText('Detail: Card 1')).not.toBeInTheDocument();
      expect(screen.getByText('Detail: Card 2')).toBeInTheDocument();
    });

    test('should toggle a slot closed in multi mode when same card is clicked again', () => {
      render(
        <Dashboard
          selectedTemplate={multiTemplate}
          templates={[multiTemplate]}
          filters={[]}
          loading={false}
          renderCardDetail={renderDetail}
          detailMode="multi"
        />
      );

      const allButtons = screen.getAllByRole('button');
      const card1Button = allButtons.find((b) => {
        return b.textContent?.includes('Card 1');
      });
      expect(card1Button).toBeDefined();

      fireEvent.click(card1Button!);
      expect(screen.getByText('Detail: Card 1')).toBeInTheDocument();

      // Second click on same card should close it
      fireEvent.click(card1Button!);
      expect(screen.queryByText('Detail: Card 1')).not.toBeInTheDocument();
    });
  });
});
