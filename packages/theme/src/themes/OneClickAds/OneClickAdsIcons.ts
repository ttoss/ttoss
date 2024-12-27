import { IconifyIcon, addIcon } from '@ttoss/react-icons';

export const OneClickAdsIcons: Record<
  string,
  | IconifyIcon
  | {
      __esModule: true;
      default: IconifyIcon;
    }
> = {
  //   add: addFilledIcon,
  //   'arrow-right': arrowRightIcon,
  //   attachment: attachmentIcon,
  //   avatar: userAvatarFilledAltIcon,
  //   'caret-down': caretDownIcon,
  //   'caret-up': caretUpIcon,
  //   calendar: calendarIcon,
  //   'checkbox-checked': checkboxCheckedFilled,
  //   'checkbox-indeterminate': checkboxIndeterminateFilledIcon,
  //   'checkbox-unchecked': checkboxIcon,
  //   check: checkMarkIcon,
  //   'check-mark': checkMarkOutlineIcon,
  //   close: closeIcon,
  //   copy: copyIcon,
  //   download: downloadIcon,
  //   edit: editIcon,
  //   email: emailIcon,
  //   delete: trashCanIcon,
  //   error: errorFilledIcon,
  //   info: informationFilledIcon,
  //   language: languageIcon,
  //   loading: loadingIcon,
  //   'menu-open': menuIcon,
  //   'open-link': arrowUpRightIcon,
  //   paste: pasteIcon,
  //   'picker-down': chevronDownIcon,
  //   'picker-up': chevronUpIcon,
  //   'nav-left': chevronLeftIcon,
  //   'nav-right': chevronRightIcon,
  //   'radio-not-selected': radioButtonIcon,
  //   'radio-selected': radioButtonCheckedIcon,
  //   refresh: renewIcon,
  //   replicate: replicateIcon,
  //   search: searchIcon,
  //   share: shareIcon,
  //   subtract: subtractIcon,
  //   'success-circle': successCircleIcon,
  //   'small-close': closeFilledIcon,
  //   'three-dots-loading': threeDotsLoadingIcon,
  //   time: timeIcon,
  //   upload: uploadIcon,
  //   'view-off': viewOffFilledIcon,
  //   'view-on': viewFilledIcon,
  //   warning: warningFilledIcon,
  //   'warning-alt': warningAltIcon,
};

Object.entries(OneClickAdsIcons).forEach(([key, icon]) => {
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
