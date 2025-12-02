/**
 * Need this import to extend yup types on build time.
 */
import './typings.d';

import * as yup from 'yup';

import { isCnpjValid } from '../Brazil/FormFieldCNPJ';
import { isCpfValid } from '../Brazil/FormFieldCPF';

yup.addMethod(yup.string, 'cnpj', function () {
  return this.test('valid-cnpj', 'Invalid CNPJ', (value) => {
    return isCnpjValid(value);
  });
});

yup.addMethod(yup.string, 'cpf', function () {
  return this.test('valid-cpf', 'Invalid CPF', (value) => {
    return isCpfValid(value);
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
