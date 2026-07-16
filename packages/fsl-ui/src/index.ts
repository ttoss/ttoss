'use client';

// Components are React Aria wrappers with hooks — the whole component entry
// is a client module (Next.js App Router). The `./semantics` entry stays
// directive-free: taxonomy data is server-safe.
export type {
  BreadcrumbProps,
  BreadcrumbsProps,
} from './components/Breadcrumbs/Breadcrumbs';
export {
  Breadcrumb,
  breadcrumbMeta,
  Breadcrumbs,
  breadcrumbsMeta,
} from './components/Breadcrumbs/Breadcrumbs';
export type { ButtonProps } from './components/Button/Button';
export { Button, buttonMeta } from './components/Button/Button';
export type { CheckboxProps } from './components/Checkbox/Checkbox';
export { Checkbox, checkboxMeta } from './components/Checkbox/Checkbox';
export type { CheckboxGroupProps } from './components/CheckboxGroup/CheckboxGroup';
export {
  CheckboxGroup,
  checkboxGroupMeta,
} from './components/CheckboxGroup/CheckboxGroup';
export type {
  GridListItemProps,
  GridListProps,
} from './components/GridList/GridList';
export {
  GridList,
  GridListItem,
  gridListItemMeta,
  gridListMeta,
} from './components/GridList/GridList';
export type { GroupProps } from './components/Group/Group';
export { Group, groupMeta } from './components/Group/Group';
export type { LinkProps } from './components/Link/Link';
export { Link, linkMeta } from './components/Link/Link';
export type {
  ListBoxItemProps,
  ListBoxProps,
} from './components/ListBox/ListBox';
export {
  ListBox,
  ListBoxItem,
  listBoxItemMeta,
  listBoxMeta,
} from './components/ListBox/ListBox';
export type { MeterProps } from './components/Meter/Meter';
export { Meter, meterMeta } from './components/Meter/Meter';
export type { NumberFieldProps } from './components/NumberField/NumberField';
export {
  NumberField,
  numberFieldMeta,
} from './components/NumberField/NumberField';
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
  TabListProps,
  TabPanelProps,
  TabProps,
  TabsProps,
} from './components/Tabs/Tabs';
export {
  Tab,
  TabList,
  tabListMeta,
  tabMeta,
  TabPanel,
  tabPanelMeta,
  Tabs,
  tabsMeta,
} from './components/Tabs/Tabs';
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
export type { ToggleButtonProps } from './components/ToggleButton/ToggleButton';
export {
  ToggleButton,
  toggleButtonMeta,
} from './components/ToggleButton/ToggleButton';
export type { ToggleButtonGroupProps } from './components/ToggleButtonGroup/ToggleButtonGroup';
export {
  ToggleButtonGroup,
  toggleButtonGroupMeta,
} from './components/ToggleButtonGroup/ToggleButtonGroup';
export type { ToolbarProps } from './components/Toolbar/Toolbar';
export { Toolbar, toolbarMeta } from './components/Toolbar/Toolbar';
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
  DisclosurePanelProps,
  DisclosureProps,
  DisclosureTriggerProps,
} from './composites/Disclosure/Disclosure';
export {
  Disclosure,
  disclosureMeta,
  DisclosurePanel,
  disclosurePanelMeta,
  DisclosureTrigger,
  disclosureTriggerMeta,
} from './composites/Disclosure/Disclosure';
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
export type { PopoverProps } from './composites/Popover/Popover';
export {
  Popover,
  popoverMeta,
  PopoverTrigger,
} from './composites/Popover/Popover';
export type {
  SearchFieldControlProps,
  SearchFieldLabelProps,
  SearchFieldProps,
} from './composites/SearchField/SearchField';
export {
  SearchField,
  SearchFieldControl,
  searchFieldControlMeta,
  SearchFieldLabel,
  searchFieldLabelMeta,
  searchFieldMeta,
} from './composites/SearchField/SearchField';
export type { TagGroupProps, TagProps } from './composites/TagGroup/TagGroup';
export {
  Tag,
  TagGroup,
  tagGroupMeta,
  tagMeta,
} from './composites/TagGroup/TagGroup';
export type {
  TextAreaControlProps,
  TextAreaDescriptionProps,
  TextAreaErrorProps,
  TextAreaLabelProps,
  TextAreaProps,
} from './composites/TextArea/TextArea';
export {
  TextArea,
  TextAreaControl,
  textAreaControlMeta,
  TextAreaDescription,
  textAreaDescriptionMeta,
  TextAreaError,
  textAreaErrorMeta,
  TextAreaLabel,
  textAreaLabelMeta,
  textAreaMeta,
} from './composites/TextArea/TextArea';
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
export type { TooltipProps } from './composites/Tooltip/Tooltip';
export {
  Tooltip,
  tooltipMeta,
  TooltipTrigger,
} from './composites/Tooltip/Tooltip';
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
