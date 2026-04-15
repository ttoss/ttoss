import { yup } from 'src/index';

test('yup custom methods exist and password required enforces', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yupAny: any = yup;

  // ensure methods were attached
  expect(typeof yupAny.string().cnpj).not.toBe('undefined');
  expect(typeof yupAny.string().cpf).not.toBe('undefined');
  expect(typeof yupAny.string().password).not.toBe('undefined');

  // password required should be a schema that requires a minimum length
  const schema = yupAny.string().password({ required: true });

  // validate short password synchronously to get an error
  let threw = false;
  try {
    schema.validateSync('short');
  } catch {
    threw = true;
  }

  expect(threw).toBeTruthy();
});
