import addFilledIcon from '@iconify/icons-carbon/add-filled';
import arrowRightIcon from '@iconify/icons-carbon/arrow-right';
import arrowUpRightIcon from '@iconify/icons-carbon/arrow-up-right';
import attachmentIcon from '@iconify/icons-carbon/attachment';
import calendarIcon from '@iconify/icons-carbon/calendar';
import caretDownIcon from '@iconify/icons-carbon/caret-down';
import caretUpIcon from '@iconify/icons-carbon/caret-up';
import checkboxIcon from '@iconify/icons-carbon/checkbox';
import checkboxCheckedFilled from '@iconify/icons-carbon/checkbox-checked-filled';
import checkboxIndeterminateFilledIcon from '@iconify/icons-carbon/checkbox-indeterminate-filled';
import checkMarkIcon from '@iconify/icons-carbon/checkmark';
import checkMarkOutlineIcon from '@iconify/icons-carbon/checkmark-outline';
import chevronDownIcon from '@iconify/icons-carbon/chevron-down';
import chevronLeftIcon from '@iconify/icons-carbon/chevron-left';
import chevronRightIcon from '@iconify/icons-carbon/chevron-right';
import chevronUpIcon from '@iconify/icons-carbon/chevron-up';
import closeIcon from '@iconify/icons-carbon/close';
import closeFilledIcon from '@iconify/icons-carbon/close-filled';
import copyIcon from '@iconify/icons-carbon/copy';
import downloadIcon from '@iconify/icons-carbon/download';
import editIcon from '@iconify/icons-carbon/edit';
import emailIcon from '@iconify/icons-carbon/email';
import errorFilledIcon from '@iconify/icons-carbon/error-filled';
import informationFilledIcon from '@iconify/icons-carbon/information-filled';
import languageIcon from '@iconify/icons-carbon/language';
import menuIcon from '@iconify/icons-carbon/menu';
import pasteIcon from '@iconify/icons-carbon/paste';
import radioButtonIcon from '@iconify/icons-carbon/radio-button';
import radioButtonCheckedIcon from '@iconify/icons-carbon/radio-button-checked';
import renewIcon from '@iconify/icons-carbon/renew';
import searchIcon from '@iconify/icons-carbon/search';
import shareIcon from '@iconify/icons-carbon/share';
import timeIcon from '@iconify/icons-carbon/time';
import trashCanIcon from '@iconify/icons-carbon/trash-can';
import uploadIcon from '@iconify/icons-carbon/upload';
import userAvatarFilledAltIcon from '@iconify/icons-carbon/user-avatar-filled-alt';
import viewFilledIcon from '@iconify/icons-carbon/view-filled';
import viewOffFilledIcon from '@iconify/icons-carbon/view-off-filled';
import warningAltIcon from '@iconify/icons-carbon/warning-alt';
import warningFilledIcon from '@iconify/icons-carbon/warning-filled';
import loadingIcon from '@iconify/icons-eos-icons/loading';
import threeDotsLoadingIcon from '@iconify/icons-eos-icons/three-dots-loading';
import successCircleIcon from '@iconify/icons-mdi/success-circle';
import { addIcon, IconifyIcon } from '@ttoss/react-icons';

const replicateIcon: IconifyIcon = {
  body: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M42 15V42H15V15H42ZM42 12H15C14.2044 12 13.4413 12.3161 12.8787 12.8787C12.3161 13.4413 12 14.2044 12 15V42C12 42.7956 12.3161 43.5587 12.8787 44.1213C13.4413 44.6839 14.2044 45 15 45H42C42.7956 45 43.5587 44.6839 44.1213 44.1213C44.6839 43.5587 45 42.7956 45 42V15C45 14.2044 44.6839 13.4413 44.1213 12.8787C43.5587 12.3161 42.7956 12 42 12Z" fill="currentColor"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3 5.76389C3 4.23744 4.26071 3 5.81588 3H29V5.57963H5.81588C5.71221 5.57963 5.62816 5.66213 5.62816 5.76389V28.994C5.62816 29.0957 5.71221 29.1782 5.81588 29.1782H22.2607L18.7784 25.7602L20.6368 23.9361L27.2916 30.4681L20.6368 37L18.7784 35.1759L22.2607 31.7579H5.81588C4.26071 31.7579 3 30.5204 3 28.994V5.76389Z" fill="currentColor"/>
  </svg>`,
  width: 48,
  height: 48,
};

const subtractIcon: IconifyIcon = {
  body: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 26H34V22H14V26ZM24 44C21.2333 44 18.6333 43.4747 16.2 42.424C13.7667 41.3733 11.65 39.9487 9.85 38.15C8.05 36.35 6.62533 34.2333 5.576 31.8C4.52667 29.3667 4.00133 26.7667 4 24C4 21.2333 4.52533 18.6333 5.576 16.2C6.62667 13.7667 8.05133 11.65 9.85 9.85C11.65 8.05 13.7667 6.62533 16.2 5.576C18.6333 4.52667 21.2333 4.00133 24 4C26.7667 4 29.3667 4.52533 31.8 5.576C34.2333 6.62667 36.35 8.05133 38.15 9.85C39.95 11.65 41.3753 13.7667 42.426 16.2C43.4767 18.6333 44.0013 21.2333 44 24C44 26.7667 43.4747 29.3667 42.424 31.8C41.3733 34.2333 39.9487 36.35 38.15 38.15C36.35 39.95 34.2333 41.3753 31.8 42.426C29.3667 43.4767 26.7667 44.0013 24 44Z" fill="black"/>
  </svg>
  `,
  width: 48,
  height: 48,
};

export const BrutalIcons: Record<
  string,
  | IconifyIcon
  | {
      __esModule: true;
      default: IconifyIcon;
    }
> = {
  add: addFilledIcon,
  'arrow-right': arrowRightIcon,
  attachment: attachmentIcon,
  avatar: userAvatarFilledAltIcon,
  'caret-down': caretDownIcon,
  'caret-up': caretUpIcon,
  calendar: calendarIcon,
  'checkbox-checked': checkboxCheckedFilled,
  'checkbox-indeterminate': checkboxIndeterminateFilledIcon,
  'checkbox-unchecked': checkboxIcon,
  check: checkMarkIcon,
  'check-mark': checkMarkOutlineIcon,
  close: closeIcon,
  copy: copyIcon,
  download: downloadIcon,
  edit: editIcon,
  email: emailIcon,
  delete: trashCanIcon,
  error: errorFilledIcon,
  info: informationFilledIcon,
  language: languageIcon,
  loading: loadingIcon,
  'menu-open': menuIcon,
  'open-link': arrowUpRightIcon,
  paste: pasteIcon,
  'picker-down': chevronDownIcon,
  'picker-up': chevronUpIcon,
  'nav-left': chevronLeftIcon,
  'nav-right': chevronRightIcon,
  'radio-not-selected': radioButtonIcon,
  'radio-selected': radioButtonCheckedIcon,
  refresh: renewIcon,
  replicate: replicateIcon,
  search: searchIcon,
  share: shareIcon,
  subtract: subtractIcon,
  'success-circle': successCircleIcon,
  'small-close': closeFilledIcon,
  'three-dots-loading': threeDotsLoadingIcon,
  time: timeIcon,
  upload: uploadIcon,
  'view-off': viewOffFilledIcon,
  'view-on': viewFilledIcon,
  warning: warningFilledIcon,
  'warning-alt': warningAltIcon,
};

Object.entries(BrutalIcons).forEach(([key, icon]) => {
  /**
   * "It happens when an ES module imports a CommonJS module with the default property present and the __esModule property set to true."
   * https://github.com/evanw/esbuild/issues/1719#issuecomment-953470495
   */
  if ('default' in icon) {
    addIcon(key, icon.default);
    return;
  }

  addIcon(key, icon);
});
