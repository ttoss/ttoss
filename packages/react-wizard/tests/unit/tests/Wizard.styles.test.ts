import {
  getWizardPrimaryButtonVariant,
  getWizardShellSx,
  getWizardStepDescriptionSx,
  getWizardStepIndicatorSx,
  getWizardStepListSx,
  getWizardStepSeparatorSx,
  getWizardStepTitleSx,
  WizardStepDescriptionFlexSx,
  WizardStepTextWrapperSx,
} from 'src/Wizard.styles';

describe('Wizard styles', () => {
  test('returns shell styles and falls back to spotlight accent for unknown variants', () => {
    expect(getWizardShellSx()).toEqual({
      width: '100%',
      minHeight: '300px',
      border: '1px solid',
      borderColor: 'display.border.muted.default',
      borderRadius: '8px',
      overflow: 'hidden',
    });

    expect(getWizardPrimaryButtonVariant('unknown-variant' as never)).toBe(
      'accent'
    );
  });

  test('builds spotlight backgrounds for primary and accent variants', () => {
    const primaryStepList = getWizardStepListSx({
      layout: 'top',
      variant: 'spotlight-primary',
    });
    const accentStepList = getWizardStepListSx({
      layout: 'left',
      variant: 'spotlight-accent',
    });

    const primaryBackground = primaryStepList.background as
      | ((theme: unknown) => string | undefined)
      | undefined;
    const accentBackground = accentStepList.background as
      | ((theme: unknown) => string | undefined)
      | undefined;

    expect(primaryStepList.width).toBe('100%');
    expect(primaryStepList.backgroundSize).toBe('400% 400%');
    expect(
      primaryBackground?.({
        colors: {
          action: {
            background: {
              primary: { default: '#111111' },
              secondary: { default: '#222222' },
            },
          },
        },
      })
    ).toBe('linear-gradient(270deg, #111111, #222222, #111111)');

    expect(accentStepList.minWidth).toBe('200px');
    expect(
      accentBackground?.({
        colors: {
          action: {
            background: {
              accent: { default: '#333333', active: '#444444' },
            },
          },
        },
      })
    ).toBe('linear-gradient(270deg, #333333, #444444, #333333)');
    expect(accentBackground?.({ colors: {} })).toBeUndefined();
  });

  test('returns non-spotlight step list styles for standard variants', () => {
    const stepList = getWizardStepListSx({
      layout: 'right',
      variant: 'secondary',
    });

    expect(stepList).toEqual({
      position: 'relative',
      padding: '6',
      backgroundColor: 'action.background.secondary.default',
      minWidth: '200px',
    });
    expect(getWizardPrimaryButtonVariant('primary')).toBe('primary');
    expect(getWizardPrimaryButtonVariant('secondary')).toBe('secondary');
    expect(getWizardPrimaryButtonVariant('accent')).toBe('accent');
  });

  test('returns step indicator, separator, title, and description styles', () => {
    expect(
      getWizardStepIndicatorSx({
        status: 'completed',
        variant: 'secondary',
        isClickable: true,
      })
    ).toEqual({
      borderColor: 'action.text.primary.default',
      backgroundColor: 'action.text.primary.default',
      color: 'action.background.secondary.default',
      opacity: 1,
      transition: 'all 0.2s ease',
      _hover: {
        opacity: 1,
      },
    });

    expect(
      getWizardStepIndicatorSx({
        status: 'upcoming',
        variant: 'accent',
        isClickable: false,
      })
    ).toEqual({
      borderColor: 'action.text.accent.default',
      backgroundColor: 'transparent',
      color: 'action.text.accent.default',
      opacity: 0.4,
      transition: 'all 0.2s ease',
    });

    expect(
      getWizardStepSeparatorSx({ isCompleted: true, variant: 'primary' })
    ).toEqual({
      backgroundColor: 'action.text.primary.default',
      opacity: 1,
    });

    expect(
      getWizardStepSeparatorSx({ isCompleted: false, variant: 'accent' })
    ).toEqual({
      backgroundColor: 'action.text.accent.default',
      opacity: 0.4,
    });

    expect(
      getWizardStepTitleSx({ status: 'active', variant: 'spotlight-primary' })
    ).toEqual({
      color: 'display.text.accent.default',
      textAlign: 'center',
      fontWeight: 'bold',
      opacity: 1,
    });

    expect(
      getWizardStepTitleSx({ status: 'completed', variant: 'primary' })
    ).toEqual({
      color: 'action.text.primary.default',
      textAlign: 'center',
      fontWeight: 'normal',
      opacity: 1,
    });

    expect(
      getWizardStepDescriptionSx({ status: 'upcoming', variant: 'primary' })
    ).toEqual({
      color: 'action.text.primary.default',
      textAlign: 'center',
      opacity: 0.4,
    });

    expect(
      getWizardStepDescriptionSx({ status: 'active', variant: 'accent' })
    ).toEqual({
      color: 'action.text.accent.default',
      textAlign: 'center',
      opacity: 1,
    });
  });

  test('exports the shared text alignment objects', () => {
    expect(WizardStepDescriptionFlexSx).toEqual({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    });
    expect(WizardStepTextWrapperSx).toEqual({
      textAlign: 'center',
    });
    expect(getWizardPrimaryButtonVariant()).toBe('accent');
  });
});
