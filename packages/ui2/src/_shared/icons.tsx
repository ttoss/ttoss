/**
 * Shared inline SVG icons used across ui2 components.
 *
 * These are lightweight inline SVGs to avoid external icon dependencies.
 * Each icon uses currentColor so it inherits the parent's text color.
 */

/** Checkmark icon — used by Checkbox indicator. */
export const CheckIcon = () => {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
    >
      <path
        d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/** Chevron-down icon — used by Accordion indicator. */
export const ChevronDownIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
};
