export type PlanCardVariantType =
  | 'primary'
  | 'secondary'
  /**
   * @deprecated Use `primary`.
   */
  | 'default'
  /**
   * @deprecated Use `secondary`.
   */
  | 'enterprise';

export type PlanCardVariantStyles = {
  backgroundColor: string;
  color: string;
  borderColor: string;
  positiveColor: string;
  secondaryColor: string;
};

const normalizeVariant = (variantType?: PlanCardVariantType) => {
  if (variantType === 'default') return 'primary';
  if (variantType === 'enterprise') return 'secondary';
  return variantType ?? 'primary';
};

/**
 * PlanCard variants follow the same pattern as `Tooltip` variants:
 * a simple mapping from `variantType` to a small set of style tokens.
 */
export const getPlanCardVariantStyles = (
  variantType?: PlanCardVariantType
): PlanCardVariantStyles => {
  const variant = normalizeVariant(variantType);

  const variants: Record<
    Exclude<PlanCardVariantType, 'default' | 'enterprise'>,
    PlanCardVariantStyles
  > = {
    primary: {
      // Primary is the default PlanCard styling (previously `muted`).
      backgroundColor: 'display.background.primary.default',
      color: 'display.text.primary.default',
      secondaryColor: 'display.text.secondary.default',
      borderColor: 'display.border.muted.default',
      positiveColor: 'feedback.text.positive.default',
    },
    secondary: {
      // Secondary matches the old `enterprise` look.
      backgroundColor: 'display.background.primary.active',
      color: 'action.text.primary.default',
      secondaryColor: 'action.text.primary.default',
      borderColor: 'display.border.muted.default',
      positiveColor: 'action.text.primary.default',
    },
  };

  return variants[variant] ?? variants.primary;
};
