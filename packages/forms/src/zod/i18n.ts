import { defineMessage } from '@ttoss/react-i18n';
import * as z from 'zod';

const customErrorMap = (
  issue: z.ZodIssueOptionalMessage,
  ctx: z.ErrorMapCtx
) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined') {
      return {
        message: defineMessage({
          defaultMessage: 'Field is required',
          description: 'Field is required',
        }),
      };
    }
    return {
      message: {
        ...defineMessage({
          defaultMessage: 'Invalid Value for Field of type {expected}',
          description: 'Invalid Value',
        }),
        values: { expected: issue.expected },
      },
    };
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      return {
        message: {
          ...defineMessage({
            defaultMessage: 'Field must be at least {min} characters',
            description: 'Min length field',
          }),
          values: { min: issue.minimum },
        },
      };
    }
  }

  return { message: ctx.defaultError };
};

// Type assertion needed because we're extending Zod's error map to support i18n message descriptors
z.setErrorMap(customErrorMap as z.ZodErrorMap);
