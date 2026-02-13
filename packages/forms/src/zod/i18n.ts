import { defineMessage } from '@ttoss/react-i18n';
import * as z from 'zod';

const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined') {
      return {
        message: JSON.stringify(
          defineMessage({
            defaultMessage: 'Field is required',
            description: 'Field is required',
          })
        ),
      };
    }
    return {
      message: JSON.stringify({
        ...defineMessage({
          defaultMessage: 'Invalid Value for Field of type {expected}',
          description: 'Invalid Value',
        }),
        values: { expected: issue.expected },
      }),
    };
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      return {
        message: JSON.stringify({
          ...defineMessage({
            defaultMessage: 'Field must be at least {min} characters',
            description: 'Min length field',
          }),
          values: { min: issue.minimum },
        }),
      };
    }
  }

  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);
