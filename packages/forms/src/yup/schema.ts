import * as yup from 'yup';
import { isCnpjValid } from '../Brazil/FormFieldCNPJ';
/**
 * Need this import to extend yup types on build time.
 */
import './typings.d';

yup.addMethod(yup.string, 'cnpj', function () {
  return this.test('valid-cnpj', 'Invalid CNPJ', (value) => {
    return isCnpjValid(value);
  });
});

yup.addMethod(
  yup.string,
  'password',
  function ({ required }: { required?: boolean } = {}) {
    const schema = this.trim();

    if (required) {
      schema.required('Password is required');
    }

    return schema.min(8, 'Password must be at least 8 characters long');
  }
);
