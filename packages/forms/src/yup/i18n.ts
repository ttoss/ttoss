import { setLocale } from 'yup';

import { validationMessages } from '../i18n/messages';

setLocale({
  mixed: {
    required: validationMessages.required,
    notType: ({ type }) => {
      return { ...validationMessages.invalidType, values: { type } };
    },
  },
  string: {
    min: ({ min }) => {
      return { ...validationMessages.minLength, values: { min } };
    },
  },
});
