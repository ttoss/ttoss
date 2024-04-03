import { isCnpjValid } from '@ttoss/forms/brazil';
import yup from 'yup';

yup.addMethod(yup.string, 'cnpj', function () {
  return this.test('valid-cnpj', 'Invalid CNPJ', (value) => {
    return isCnpjValid(value);
  });
});

declare module 'yup' {
  interface StringSchema<
    TType extends yup.Maybe<string> = string | undefined,
    TOut extends TType = TType,
  > extends yup.BaseSchema<TType, TOut> {
    cnpj(): StringSchema<TType>;
  }
}

export { yup };
