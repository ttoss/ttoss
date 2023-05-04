import { ThemeUIStyleObject, Theme as ThemeUi } from 'theme-ui';

type ReactAuthVariants = {
  card?: ThemeUIStyleObject;
  logo?: ThemeUIStyleObject;
  form?: {
    container?: ThemeUIStyleObject;
    buttonsContainer?: ThemeUIStyleObject;
    fieldsContainer?: ThemeUIStyleObject;
  };
};

export type Theme = ThemeUi & {
  reactAuth?: ReactAuthVariants;
};
