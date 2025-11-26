import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import { SpotlightCard } from '../../../src/components/SpotlightCard';

describe('SpotlightCard', () => {
  test('should render SpotlightCard with essential props (no buttons)', () => {
    render(
      <SpotlightCard
        title="Main Title"
        description="Detailed description"
        // iconName foi removido do componente, mantendo apenas iconSymbol
        iconSymbol="test-symbol"
      />
    );

    expect(screen.getByTestId('spotlight-card')).toBeInTheDocument();
    expect(screen.getByText('Main Title')).toBeInTheDocument();
    expect(screen.getByText('Detailed description')).toBeInTheDocument();

    // Ensure buttons are NOT rendered
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  test('should render buttons when props are provided', () => {
    render(
      <SpotlightCard
        title="Main Title"
        description="Desc"
        iconSymbol="test-symbol"
        // Agora passamos o children dentro do objeto da prop
        firstButton={{ children: 'Watch Tutorial' }}
        secondButton={{ children: 'Read Article' }}
      />
    );

    expect(screen.getByText('Watch Tutorial')).toBeInTheDocument();
    expect(screen.getByText('Read Article')).toBeInTheDocument();
  });

  test('should render subtitle when provided', () => {
    render(
      <SpotlightCard
        title="Main Title"
        subtitle="Optional Subtitle"
        description="Desc"
        iconSymbol="symbol"
      />
    );
    expect(screen.getByText('Optional Subtitle')).toBeInTheDocument();
  });

  test('should call click handlers when buttons are clicked', () => {
    const onFirstMock = jest.fn();
    const onSecondMock = jest.fn();

    render(
      <SpotlightCard
        title="Title"
        description="Desc"
        iconSymbol="symbol"
        // O onClick agora é passado dentro do objeto de configuração do botão
        firstButton={{
          children: 'Primary Button',
          onClick: onFirstMock,
        }}
        secondButton={{
          children: 'Secondary Button',
          onClick: onSecondMock,
        }}
      />
    );

    fireEvent.click(screen.getByText('Primary Button'));
    expect(onFirstMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Secondary Button'));
    expect(onSecondMock).toHaveBeenCalledTimes(1);
  });

  // Teste extra (Opcional): Verificar se aceita um nó React customizado, já que sua refatoração permite isso
  test('should render custom ReactNode as a button', () => {
    render(
      <SpotlightCard
        title="Title"
        description="Desc"
        iconSymbol="symbol"
        firstButton={<div data-testid="custom-element">Custom Element</div>}
      />
    );

    expect(screen.getByTestId('custom-element')).toBeInTheDocument();
    expect(screen.getByText('Custom Element')).toBeInTheDocument();
  });
});
