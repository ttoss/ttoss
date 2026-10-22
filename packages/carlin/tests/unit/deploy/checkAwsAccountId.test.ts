import { checkAwsAccountId } from 'src/deploy/checkAwsAccountId';
import { getAwsAccountId } from 'src/utils/getAwsAccountId';

jest.mock('src/utils/getAwsAccountId', () => {
  return { getAwsAccountId: jest.fn() };
});

const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
  return undefined as never;
});

beforeEach(() => {
  exitSpy.mockClear();
});

test('exits non-zero when the credentials belong to another account', async () => {
  jest.mocked(getAwsAccountId).mockResolvedValue('026090559282');

  await checkAwsAccountId('228368756364');

  expect(exitSpy).toHaveBeenCalledWith(1);
});

test('continues when the account matches', async () => {
  jest.mocked(getAwsAccountId).mockResolvedValue('228368756364');

  await checkAwsAccountId('228368756364');

  expect(exitSpy).not.toHaveBeenCalled();
});

test('continues when no credentials are found', async () => {
  jest
    .mocked(getAwsAccountId)
    .mockRejectedValue(
      Object.assign(new Error('missing'), { code: 'CredentialsError' })
    );

  await checkAwsAccountId('228368756364');

  expect(exitSpy).not.toHaveBeenCalled();
});
