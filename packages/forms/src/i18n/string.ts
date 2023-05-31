import { defineMessage } from '@ttoss/react-i18n';
import { setLocale } from 'yup';

setLocale({
  string: {
    min: ({ min }) => {
      return {
        ...defineMessage({
          defaultMessage: 'Field must be at least {min} characters',
          description: 'Min length field',
        }),
        values: { min },
      };
    },
  },
});
