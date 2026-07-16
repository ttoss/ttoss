'use client';

// Components are React Aria wrappers with hooks — the whole component entry
// is a client module (Next.js App Router). The `./semantics` entry stays
// directive-free: taxonomy data is server-safe.
export type { ButtonProps } from './components/Button/Button';
export { Button, buttonMeta } from './components/Button/Button';
export type { CheckboxProps } from './components/Checkbox/Checkbox';
export { Checkbox, checkboxMeta } from './components/Checkbox/Checkbox';
export type { LinkProps } from './components/Link/Link';
export { Link, linkMeta } from './components/Link/Link';
export type { ProgressBarProps } from './components/ProgressBar/ProgressBar';
export {
  ProgressBar,
  progressBarMeta,
} from './components/ProgressBar/ProgressBar';
export type {
  RadioGroupProps,
  RadioProps,
} from './components/RadioGroup/RadioGroup';
export {
  Radio,
  RadioGroup,
  radioGroupMeta,
  radioMeta,
} from './components/RadioGroup/RadioGroup';
export type { SelectItemProps, SelectProps } from './components/Select/Select';
export {
  Select,
  SelectItem,
  selectItemMeta,
  selectMeta,
} from './components/Select/Select';
export type { SeparatorProps } from './components/Separator/Separator';
export { Separator, separatorMeta } from './components/Separator/Separator';
export type { SwitchProps } from './components/Switch/Switch';
export { Switch, switchMeta } from './components/Switch/Switch';
export type {
  ToastContent,
  ToastProps,
  ToastQueue,
  ToastRegionProps,
} from './components/Toast/Toast';
export {
  createToastQueue,
  Toast,
  toastMeta,
  ToastRegion,
  toastRegionMeta,
} from './components/Toast/Toast';
export type {
  AccordionItemProps,
  AccordionPanelProps,
  AccordionProps,
  AccordionTriggerProps,
} from './composites/Accordion/Accordion';
export {
  Accordion,
  AccordionItem,
  accordionItemMeta,
  accordionMeta,
  AccordionPanel,
  accordionPanelMeta,
  AccordionTrigger,
  accordionTriggerMeta,
} from './composites/Accordion/Accordion';
export type { ConfirmationDialogProps } from './composites/ConfirmationDialog/ConfirmationDialog';
export {
  ConfirmationDialog,
  confirmationDialogMeta,
} from './composites/ConfirmationDialog/ConfirmationDialog';
export type {
  DialogActionsPlatform,
  DialogActionsProps,
  DialogBodyProps,
  DialogHeadingProps,
  DialogModalProps,
  DialogProps,
} from './composites/Dialog/Dialog';
export {
  Dialog,
  DialogActions,
  dialogActionsMeta,
  DialogBody,
  dialogBodyMeta,
  DialogHeading,
  dialogHeadingMeta,
  dialogMeta,
  DialogModal,
  dialogModalMeta,
  DialogTrigger,
} from './composites/Dialog/Dialog';
export type {
  FormActionsProps,
  FormProps,
  FormSubmitProps,
} from './composites/Form/Form';
export {
  Form,
  FormActions,
  formActionsMeta,
  formMeta,
  FormSubmit,
  formSubmitMeta,
} from './composites/Form/Form';
export type { MenuItemProps, MenuProps } from './composites/Menu/Menu';
export {
  Menu,
  MenuItem,
  menuItemMeta,
  menuMeta,
  MenuTrigger,
} from './composites/Menu/Menu';
export type {
  TextFieldControlProps,
  TextFieldDescriptionProps,
  TextFieldErrorProps,
  TextFieldLabelProps,
  TextFieldProps,
} from './composites/TextField/TextField';
export {
  TextField,
  TextFieldControl,
  textFieldControlMeta,
  TextFieldDescription,
  textFieldDescriptionMeta,
  TextFieldError,
  textFieldErrorMeta,
  TextFieldLabel,
  textFieldLabelMeta,
  textFieldMeta,
} from './composites/TextField/TextField';
export type {
  WizardNavigationProps,
  WizardProps,
  WizardStepProps,
  WizardSummaryProps,
} from './composites/Wizard/Wizard';
export {
  Wizard,
  wizardMeta,
  WizardNavigation,
  wizardNavigationMeta,
  WizardStep,
  wizardStepMeta,
  WizardSummary,
  wizardSummaryMeta,
} from './composites/Wizard/Wizard';
