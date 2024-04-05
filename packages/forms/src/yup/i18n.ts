import { defineMessage } from '@ttoss/react-i18n';
import { setLocale } from 'yup';

setLocale({
  mixed: {
    required: defineMessage({
      defaultMessage: 'Field is required',
      description: 'Field is required',
    }),
    notType: ({ type }) => {
      return {
        ...defineMessage({
          defaultMessage: 'Invalid Value for Field of type {type}',
          description: 'Invalid Value',
        }),
        values: { type },
      };
    },
  },
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
