import { IconifyIcon, addIcon } from '@ttoss/react-icons';

const checkedCheckBox: IconifyIcon = {
  body: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <rect x="5" y="6" width="14" height="12" rx="4" fill="#111827"/>
  <path d="M6.25 3C5.38805 3 4.5614 3.34241 3.9519 3.9519C3.34241 4.5614 3 5.38805 3 6.25V17.75C3 18.612 3.34241 19.4386 3.9519 20.0481C4.5614 20.6576 5.38805 21 6.25 21H17.75C18.612 21 19.4386 20.6576 20.0481 20.0481C20.6576 19.4386 21 18.612 21 17.75V6.25C21 5.38805 20.6576 4.5614 20.0481 3.9519C19.4386 3.34241 18.612 3 17.75 3H6.25ZM17.28 9.28L10.526 16.027C10.3854 16.1675 10.1948 16.2463 9.996 16.2463C9.79725 16.2463 9.60663 16.1675 9.466 16.027L6.72 13.28C6.58752 13.1378 6.5154 12.9498 6.51883 12.7555C6.52225 12.5612 6.60097 12.3758 6.73838 12.2384C6.87579 12.101 7.06118 12.0223 7.25548 12.0188C7.44978 12.0154 7.63783 12.0875 7.78 12.22L9.997 14.436L16.22 8.219C16.2897 8.1494 16.3725 8.09421 16.4635 8.0566C16.5546 8.01898 16.6522 7.99967 16.7507 7.99976C16.8492 7.99985 16.9468 8.01935 17.0378 8.05714C17.1287 8.09493 17.2114 8.15027 17.281 8.22C17.3506 8.28973 17.4058 8.37249 17.4434 8.46355C17.481 8.55461 17.5003 8.65218 17.5002 8.75071C17.5001 8.84923 17.4807 8.94677 17.4429 9.03776C17.4051 9.12875 17.3497 9.2114 17.28 9.281" fill="#03FF7A"/>
  </svg>
  `,
  width: 24,
  height: 24,
};

const uncheckedCheckBox: IconifyIcon = {
  body: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M3 6.25C3 5.38805 3.34241 4.5614 3.9519 3.9519C4.5614 3.34241 5.38805 3 6.25 3H17.75C18.612 3 19.4386 3.34241 20.0481 3.9519C20.6576 4.5614 21 5.38805 21 6.25V17.75C21 18.612 20.6576 19.4386 20.0481 20.0481C19.4386 20.6576 18.612 21 17.75 21H6.25C5.38805 21 4.5614 20.6576 3.9519 20.0481C3.34241 19.4386 3 18.612 3 17.75V6.25ZM6.25 5C5.56 5 5 5.56 5 6.25V17.75C5 18.44 5.56 19 6.25 19H17.75C18.44 19 19 18.44 19 17.75V6.25C19 5.56 18.44 5 17.75 5H6.25Z" fill="#465A69"/>
  </svg>
  `,
  width: 24,
  height: 24,
};

const radioButtonNotSelected: IconifyIcon = {
  body: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 22.002C17.524 22.002 22.002 17.524 22.002 12.001C22.002 6.47702 17.524 1.99902 12 1.99902C6.47605 1.99902 1.99805 6.47702 1.99805 12.001C1.99805 17.524 6.47605 22.002 12 22.002ZM12 20.502C10.8727 20.5193 9.75319 20.3122 8.70665 19.8928C7.6601 19.4733 6.70744 18.8499 5.90411 18.0588C5.10078 17.2677 4.46282 16.3247 4.02736 15.2847C3.5919 14.2447 3.36765 13.1285 3.36765 12.001C3.36765 10.8736 3.5919 9.75734 4.02736 8.71735C4.46282 7.67737 5.10078 6.73438 5.90411 5.94327C6.70744 5.15217 7.6601 4.52875 8.70665 4.10929C9.75319 3.68984 10.8727 3.48273 12 3.50002C14.2388 3.5243 16.3776 4.43069 17.9522 6.02239C19.5267 7.61409 20.4098 9.76262 20.4098 12.0015C20.4098 14.2404 19.5267 16.389 17.9522 17.9807C16.3776 19.5724 14.2388 20.4777 12 20.502Z" fill="#465A69"/>
  </svg>
  `,
  width: 24,
  height: 24,
};

const radioButtonCheckedIcon: IconifyIcon = {
  body: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
  <path d="M12 1.99902C17.524 1.99902 22.002 6.47702 22.002 12.001C22.002 17.524 17.524 22.002 12 22.002C6.47605 22.002 1.99805 17.524 1.99805 12.001C1.99805 6.47702 6.47605 1.99902 12 1.99902ZM12 3.49902C10.8759 3.48683 9.76041 3.69772 8.71827 4.1195C7.67612 4.54127 6.72798 5.16554 5.92871 5.95619C5.12944 6.74684 4.49492 7.68816 4.06187 8.72566C3.62882 9.76317 3.40584 10.8763 3.40584 12.0005C3.40584 13.1248 3.62882 14.2379 4.06187 15.2754C4.49492 16.3129 5.12944 17.2542 5.92871 18.0449C6.72798 18.8355 7.67612 19.4598 8.71827 19.8816C9.76041 20.3033 10.8759 20.5142 12 20.502C14.2321 20.4678 16.3611 19.5571 17.9274 17.9666C19.4937 16.376 20.3717 14.2333 20.3717 12.001C20.3717 9.76874 19.4937 7.626 17.9274 6.03548C16.3611 4.44496 14.2321 3.53326 12 3.49902ZM11.996 6.00002C13.5868 6.00002 15.1124 6.63195 16.2373 7.7568C17.3621 8.88164 17.994 10.4073 17.994 11.998C17.994 13.5888 17.3621 15.1144 16.2373 16.2393C15.1124 17.3641 13.5868 17.996 11.996 17.996C10.4053 17.996 8.87966 17.3641 7.75482 16.2393C6.62998 15.1144 5.99805 13.5888 5.99805 11.998C5.99805 10.4073 6.62998 8.88164 7.75482 7.7568C8.87966 6.63195 10.4053 6.00002 11.996 6.00002Z" fill="#03FF7A"/>
  </svg>
  `,
  width: 24,
  height: 24,
};

const pressureHigh: IconifyIcon = {
  body: `
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M16.0155 7.35948C15.8058 7.36277 15.6028 7.28706 15.4476 7.14773L11.9972 3.8762L8.54684 7.14773C8.39233 7.28912 8.1895 7.36766 7.97892 7.36766C7.76833 7.36766 7.5655 7.28912 7.411 7.14773C7.33838 7.07949 7.28055 6.99738 7.24104 6.90637C7.20153 6.81537 7.18115 6.71738 7.18115 6.61836C7.18115 6.51934 7.20153 6.42135 7.24104 6.33034C7.28055 6.23934 7.33838 6.15723 7.411 6.08898L11.4293 2.29866C11.5838 2.15728 11.7866 2.07874 11.9972 2.07874C12.2078 2.07874 12.4106 2.15728 12.5651 2.29866L16.5834 6.0784C16.6577 6.14676 16.717 6.22952 16.7575 6.3215C16.798 6.41349 16.8189 6.51274 16.8189 6.61307C16.8189 6.71339 16.798 6.81264 16.7575 6.90463C16.717 6.99661 16.6577 7.07937 16.5834 7.14773C16.4299 7.29091 16.2266 7.37048 16.0155 7.37007V7.35948Z" fill="#03FF7A"/>
    <path d="M16.0155 12.2728C15.8058 12.2761 15.6028 12.2004 15.4476 12.0611L11.9972 8.78953L8.54684 12.0611C8.39233 12.2024 8.1895 12.281 7.97892 12.281C7.76833 12.281 7.5655 12.2024 7.411 12.0611C7.33838 11.9928 7.28055 11.9107 7.24104 11.8197C7.20153 11.7287 7.18115 11.6307 7.18115 11.5317C7.18115 11.4327 7.20153 11.3347 7.24104 11.2437C7.28055 11.1527 7.33838 11.0706 7.411 11.0023L11.4293 7.21199C11.5838 7.07061 11.7866 6.99207 11.9972 6.99207C12.2078 6.99207 12.4106 7.07061 12.5651 7.21199L16.5834 10.9917C16.6577 11.0601 16.717 11.1428 16.7575 11.2348C16.798 11.3268 16.8189 11.4261 16.8189 11.5264C16.8189 11.6267 16.798 11.726 16.7575 11.818C16.717 11.9099 16.6577 11.9927 16.5834 12.0611C16.4299 12.2042 16.2266 12.2838 16.0155 12.2834V12.2728Z" fill="#03FF7A"/>
    <path d="M16.0155 16.9973C15.8058 17.0006 15.6028 16.9249 15.4476 16.7856L11.9972 13.514L8.54684 16.7856C8.39233 16.9269 8.1895 17.0055 7.97892 17.0055C7.76833 17.0055 7.5655 16.9269 7.411 16.7856C7.33838 16.7173 7.28055 16.6352 7.24104 16.5442C7.20153 16.4532 7.18115 16.3552 7.18115 16.2562C7.18115 16.1572 7.20153 16.0592 7.24104 15.9682C7.28055 15.8772 7.33838 15.795 7.411 15.7268L11.4293 11.9365C11.5838 11.7951 11.7866 11.7166 11.9972 11.7166C12.2078 11.7166 12.4106 11.7951 12.5651 11.9365L16.5834 15.7162C16.6577 15.7846 16.717 15.8673 16.7575 15.9593C16.798 16.0513 16.8189 16.1506 16.8189 16.2509C16.8189 16.3512 16.798 16.4505 16.7575 16.5424C16.717 16.6344 16.6577 16.7172 16.5834 16.7856C16.4299 16.9287 16.2266 17.0083 16.0155 17.0079V16.9973Z" fill="#03FF7A"/>
    <path d="M16.0155 21.9106C15.8058 21.9139 15.6028 21.8382 15.4476 21.6989L11.9972 18.4273L8.54684 21.6989C8.39233 21.8403 8.1895 21.9188 7.97892 21.9188C7.76833 21.9188 7.5655 21.8403 7.411 21.6989C7.33838 21.6306 7.28055 21.5485 7.24104 21.4575C7.20153 21.3665 7.18115 21.2685 7.18115 21.1695C7.18115 21.0705 7.20153 20.9725 7.24104 20.8815C7.28055 20.7905 7.33838 20.7084 7.411 20.6401L11.4293 16.8498C11.5838 16.7084 11.7866 16.6299 11.9972 16.6299C12.2078 16.6299 12.4106 16.7084 12.5651 16.8498L16.5834 20.6295C16.6577 20.6979 16.717 20.7807 16.7575 20.8727C16.798 20.9646 16.8189 21.0639 16.8189 21.1642C16.8189 21.2645 16.798 21.3638 16.7575 21.4558C16.717 21.5478 16.6577 21.6305 16.5834 21.6989C16.4299 21.8421 16.2266 21.9216 16.0155 21.9212V21.9106Z" fill="#03FF7A"/>
  </svg>
  `,
  width: 24,
  height: 24,
};

export const OneClickAdsIcons: Record<
  string,
  | IconifyIcon
  | {
      __esModule: true;
      default: IconifyIcon;
    }
> = {
  'checkbox-checked': checkedCheckBox,
  'checkbox-unchecked': uncheckedCheckBox,
  'radio-not-selected': radioButtonNotSelected,
  'radio-selected': radioButtonCheckedIcon,
  'meteocons:pressure-high': pressureHigh,
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
