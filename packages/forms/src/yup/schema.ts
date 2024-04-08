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
