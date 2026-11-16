import {
  nextDomainStatus,
  parseSenderDomain,
  WEBMAIL_DOMAINS,
} from '../../../src';

test.each([
  ['SolarAlfa.com.br', 'solaralfa.com.br'],
  ['https://www.solaralfa.com.br:443/contato?x=1', 'solaralfa.com.br'],
  ['vendas@SolarAlfa.com.br', 'solaralfa.com.br'],
  ['mail.solaralfa.com.br.', 'mail.solaralfa.com.br'],
  ['xn--sol-8ma.com.br', 'xn--sol-8ma.com.br'],
])('parseSenderDomain(%p) is %p', (input, domain) => {
  expect(parseSenderDomain({ input })).toEqual({ domain });
});

test.each([
  '',
  'localhost',
  'solar',
  '192.168.0.1',
  'sol_ar.com',
  '-a.com',
  'a..com',
  `${'a'.repeat(64)}.com`,
  null,
])('parseSenderDomain refuses %p as invalid', (input) => {
  expect(parseSenderDomain({ input })).toEqual({ error: 'invalid' });
});

test('parseSenderDomain refuses webmail domains', () => {
  expect(parseSenderDomain({ input: 'joao@gmail.com' })).toEqual({
    error: 'webmail',
  });
  expect(WEBMAIL_DOMAINS.has('hotmail.com')).toBe(true);
});

test('parseSenderDomain refuses reserved zones and their subdomains', () => {
  const reserved = ['SuryaEnergia.com.br'];
  expect(parseSenderDomain({ input: 'suryaenergia.com.br', reserved })).toEqual(
    { error: 'reserved' }
  );
  expect(
    parseSenderDomain({ input: 'news.suryaenergia.com.br', reserved })
  ).toEqual({ error: 'reserved' });
  expect(
    parseSenderDomain({ input: 'notsuryaenergia.com.br', reserved })
  ).toEqual({ domain: 'notsuryaenergia.com.br' });
});

test('nextDomainStatus: verified is active; a regression is error; a setup stays pending', () => {
  expect(nextDomainStatus({ previous: null, verification: 'verified' })).toBe(
    'active'
  );
  expect(
    nextDomainStatus({ previous: 'pending_dns', verification: 'pending' })
  ).toBe('pending_dns');
  expect(
    nextDomainStatus({ previous: undefined, verification: 'failed' })
  ).toBe('pending_dns');
  expect(nextDomainStatus({ previous: 'active', verification: 'failed' })).toBe(
    'error'
  );
  expect(
    nextDomainStatus({ previous: 'error', verification: 'not_found' })
  ).toBe('error');
});
