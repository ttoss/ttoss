import * as i18nCore from 'src/index';
import {
  createCatalog,
  createI18n,
  defineMessages,
  fmt,
  isFormatValue,
  isLocalizedError,
  isMessageRef,
  isMessageRefTranslated,
  LocalizedError,
  msg,
  negotiateLocale,
  renderLocalizedError,
  renderMessageRef,
} from 'src/index';

const messages = defineMessages({
  greeting: {
    defaultMessage: 'Hello, {name}!',
    description: 'Greeting',
  },
  spent: {
    defaultMessage: 'You spent {amount} on {date}.',
    description: 'Spend summary',
  },
  campaigns: {
    defaultMessage:
      '{count, plural, =0 {No campaigns} one {# campaign} other {# campaigns}}',
    description: 'Campaign count',
  },
  paused: {
    defaultMessage: 'Campaign {campaign} was <b>paused</b> because {reason}.',
    description: 'Paused campaign',
  },
  reason: {
    defaultMessage: 'its budget ran out',
    description: 'Pause reason',
  },
  lineBreak: {
    defaultMessage: 'First<br></br>Second',
    description: 'Two lines',
  },
  blocks: {
    defaultMessage:
      '<h1>Report</h1><div>Spent {amount}</div><h2>A</h2><h3>B</h3><h4>C</h4><h5>D</h5><h6>E</h6>',
    description: 'Block-level rich text',
  },
  flag: {
    defaultMessage: '{enabled, select, true {On} other {Off}}',
    description: 'Toggle state',
  },
  optional: {
    defaultMessage: 'Note: {note}',
    description: 'Optional note',
  },
  accessLost: {
    defaultMessage: 'We lost access to ad account {account}.',
    description: 'Access lost error',
  },
  invalidFields: {
    defaultMessage: 'Invalid input: {failures}',
    description: 'Every field that failed validation',
  },
  required: {
    defaultMessage: '{field} is required.',
    description: 'A required field is missing',
  },
  campaignList: {
    defaultMessage: 'Blocked by {campaigns}.',
    description: 'Campaigns blocking a change',
  },
  explicit: {
    // `@ttoss/eslint-config` enables `formatjs/no-id`, whose autofix deletes
    // explicit ids; a persisted reference needs one.
    // eslint-disable-next-line formatjs/no-id
    id: 'billing.renewal',
    defaultMessage: 'Your plan renews {when}.',
    description: 'Renewal date',
  },
});

const ptBR = {
  [messages.greeting.id]: 'Olá, {name}!',
  [messages.spent.id]: 'Você gastou {amount} em {date}.',
  [messages.paused.id]:
    'A campanha {campaign} foi <b>pausada</b> porque {reason}.',
  [messages.reason.id]: 'o orçamento acabou',
  [messages.invalidFields.id]: 'Entrada inválida: {failures}',
  [messages.required.id]: '{field} é obrigatório.',
  [messages.campaignList.id]: 'Bloqueado por {campaigns}.',
};

describe('msg', () => {
  test('creates a JSON-safe reference that round-trips', () => {
    const ref = msg(messages.greeting, { name: 'Ana' });

    expect(ref).toEqual({
      id: messages.greeting.id,
      defaultMessage: messages.greeting.defaultMessage,
      values: { name: 'Ana' },
    });
    expect(JSON.parse(JSON.stringify(ref))).toEqual(ref);
  });

  test('omits values when none are given', () => {
    expect(msg(messages.reason)).not.toHaveProperty('values');
  });

  test('keeps an explicit id', () => {
    expect(msg(messages.explicit).id).toBe('billing.renewal');
  });

  test('throws on a descriptor without an id', () => {
    expect(() => {
      return msg({ defaultMessage: 'No id' });
    }).toThrow(TypeError);
  });

  test('throws on a descriptor without a defaultMessage', () => {
    expect(() => {
      return msg({ id: 'only.id' });
    }).toThrow('only.id');
  });
});

describe('defineMessages', () => {
  test('returns its argument unchanged', () => {
    // Called through the namespace so the formatjs build plugin, which matches
    // the bare call by name, leaves these calls alone.
    const messages = { a: { id: 'a', defaultMessage: 'A' } };
    const message = { id: 'b', defaultMessage: 'B' };

    expect(i18nCore.defineMessages(messages)).toBe(messages);
    expect(i18nCore.defineMessage(message)).toBe(message);
  });
});

describe('isMessageRef', () => {
  test.each([
    [msg(messages.reason), true],
    [{ id: 'a', defaultMessage: [] }, true],
    [{ id: 'a' }, false],
    [{ defaultMessage: 'a' }, false],
    [fmt.number({ value: 1 }), false],
    ['text', false],
    [null, false],
  ])('%j → %s', (value, expected) => {
    expect(isMessageRef(value)).toBe(expected);
  });
});

describe('fmt', () => {
  test('uppercases the currency code', () => {
    expect(fmt.currency({ value: 10, currency: 'usd' })).toEqual({
      $fmt: 'currency',
      value: 10,
      currency: 'USD',
    });
  });

  test('stores dates as ISO strings', () => {
    expect(
      fmt.date({ value: new Date('2026-09-28T12:00:00Z'), timeZone: 'UTC' })
    ).toEqual({
      $fmt: 'date',
      value: '2026-09-28T12:00:00.000Z',
      timeZone: 'UTC',
    });
    expect(fmt.relativeTime({ value: '2026-09-28T12:00:00Z' })).toEqual({
      $fmt: 'relativeTime',
      value: '2026-09-28T12:00:00.000Z',
    });
  });

  test('rejects a date style mixed with date components', () => {
    expect(() => {
      return fmt.date({
        value: '2026-08-26T12:00:00Z',
        day: '2-digit',
        ...({ dateStyle: 'short' } as object),
      });
    }).toThrow('not both');
    expect(() => {
      return fmt.date({
        value: '2026-08-26T12:00:00Z',
        timeStyle: 'short',
        ...({ month: 'long' } as object),
      });
    }).toThrow(TypeError);
  });

  test('rejects an invalid date where it is created', () => {
    expect(() => {
      return fmt.date({ value: 'not a date' });
    }).toThrow(RangeError);
  });

  test('copies list items and rejects anything but an array', () => {
    const items = ['a', 'b'];
    const value = fmt.list({ items, type: 'disjunction' });

    items.push('c');

    expect(value).toEqual({
      $fmt: 'list',
      items: ['a', 'b'],
      type: 'disjunction',
    });
    expect(() => {
      return fmt.list({ items: 'a, b' as unknown as string[] });
    }).toThrow(TypeError);
  });

  test('isFormatValue recognizes every kind and nothing else', () => {
    expect(isFormatValue(fmt.percent({ ratio: 0.5 }))).toBe(true);
    expect(isFormatValue(fmt.list({ items: [] }))).toBe(true);
    expect(isFormatValue({ $fmt: 'unknown' })).toBe(false);
    expect(isFormatValue(msg(messages.reason))).toBe(false);
  });
});

describe('createI18n', () => {
  const pt = createI18n({ locale: 'pt-BR', messages: ptBR });
  const en = createI18n({ locale: 'en', messages: {} });

  test('renders a reference from the catalog', () => {
    expect(pt.render(msg(messages.greeting, { name: 'Ana' }))).toBe(
      'Olá, Ana!'
    );
  });

  test('falls back to defaultMessage when the catalog lacks the id', () => {
    const onError = jest.fn();
    const i18n = createI18n({ locale: 'pt-BR', messages: {}, onError });

    expect(i18n.render(msg(messages.greeting, { name: 'Ana' }))).toBe(
      'Hello, Ana!'
    );
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'MISSING_TRANSLATION' })
    );
  });

  test('falls back to defaultMessage with no onError given', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {
      return undefined;
    });
    const i18n = createI18n({ locale: 'pt-BR', messages: {} });

    expect(i18n.render(msg(messages.greeting, { name: 'Ana' }))).toBe(
      'Hello, Ana!'
    );
    consoleError.mockRestore();
  });

  test('reports no missing translation for the source locale', () => {
    const onError = jest.fn();
    const i18n = createI18n({
      locale: 'pt-BR',
      defaultLocale: 'pt-BR',
      messages: {},
      onError,
    });

    i18n.render(msg(messages.reason));

    expect(onError).not.toHaveBeenCalled();
  });

  test('formats deferred values in the reader locale, keeping the currency', () => {
    const ref = msg(messages.spent, {
      amount: fmt.currency({ value: 1234.5, currency: 'USD' }),
      date: fmt.date({ value: '2026-09-28T12:00:00Z', timeZone: 'UTC' }),
    });

    expect(pt.render(ref)).toBe('Você gastou US$\u00a01.234,50 em 28/09/2026.');
    expect(en.render(ref)).toBe('You spent $1,234.50 on 9/28/26.');
  });

  test('formats numbers, percents and date styles', () => {
    expect(
      pt.formatValue(
        fmt.number({ value: 1234.567, options: { maximumFractionDigits: 1 } })
      )
    ).toBe('1.234,6');
    expect(
      pt.formatValue(fmt.percent({ ratio: 0.125, maximumFractionDigits: 1 }))
    ).toBe('12,5%');
    expect(
      en.formatValue(
        fmt.date({
          value: '2026-09-28T15:30:00Z',
          timeZone: 'America/Sao_Paulo',
          timeStyle: 'short',
        })
      )
    ).toBe('12:30 PM');
    expect(
      en.formatValue(
        fmt.date({
          value: '2026-09-28T15:30:00Z',
          timeZone: 'UTC',
          dateStyle: 'long',
        })
      )
    ).toBe('September 28, 2026');
  });

  test('formats day/month dates from date components', () => {
    const dayMonth = fmt.date({
      value: '2026-08-26T12:00:00Z',
      timeZone: 'UTC',
      day: '2-digit',
      month: '2-digit',
    });

    expect(pt.formatValue(dayMonth)).toBe('26/08');
    expect(en.formatValue(dayMonth)).toBe('08/26');
    expect(pt.formatValue(JSON.parse(JSON.stringify(dayMonth)))).toBe('26/08');
    expect(
      en.formatValue(
        fmt.date({
          value: '2026-08-26T12:00:00Z',
          timeZone: 'UTC',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      )
    ).toBe('August 26, 2026');
  });

  test('formats relative time against now', () => {
    jest.setSystemTime(new Date('2026-09-28T12:00:00Z'));

    expect(
      en.formatValue(fmt.relativeTime({ value: '2026-09-27T12:00:00Z' }))
    ).toBe('yesterday');
    expect(
      pt.formatValue(fmt.relativeTime({ value: '2026-09-28T15:00:00Z' }))
    ).toBe('em 3 horas');
    expect(
      en.formatValue(fmt.relativeTime({ value: '2026-09-28T12:00:00Z' }))
    ).toBe('now');
  });

  test('keeps plural arguments numeric', () => {
    expect(en.render(msg(messages.campaigns, { count: 0 }))).toBe(
      'No campaigns'
    );
    expect(en.render(msg(messages.campaigns, { count: 1 }))).toBe('1 campaign');
    expect(en.render(msg(messages.campaigns, { count: 1200 }))).toBe(
      '1,200 campaigns'
    );
  });

  test('renders booleans for select and null as empty', () => {
    expect(en.render(msg(messages.flag, { enabled: true }))).toBe('On');
    expect(en.render(msg(messages.flag, { enabled: false }))).toBe('Off');
    expect(en.render(msg(messages.optional, { note: null }))).toBe('Note: ');
  });

  test('renders nested references in the same locale', () => {
    const ref = msg(messages.paused, {
      campaign: 'Black Friday',
      reason: msg(messages.reason),
    });

    expect(pt.render(ref)).toBe(
      'A campanha Black Friday foi pausada porque o orçamento acabou.'
    );
    expect(pt.renderHtml(ref)).toBe(
      'A campanha Black Friday foi <b>pausada</b> porque o orçamento acabou.'
    );
  });

  test('joins a list with the reader locale conjunction', () => {
    const ref = msg(messages.campaignList, {
      campaigns: fmt.list({ items: ['A', 'B', 'C'] }),
    });

    expect(en.render(ref)).toBe('Blocked by A, B, and C.');
    expect(pt.render(ref)).toBe('Bloqueado por A, B e C.');
  });

  test('renders each list item in the same locale, nested references and deferred values included', () => {
    const failures = fmt.list({
      items: [
        msg(messages.required, { field: 'Budget' }),
        msg(messages.required, { field: 'Target' }),
      ],
      type: 'unit',
      style: 'narrow',
    });
    const ref = msg(messages.invalidFields, { failures });

    expect(en.render(ref)).toBe(
      'Invalid input: Budget is required. Target is required.'
    );
    expect(pt.render(ref)).toBe(
      'Entrada inválida: Budget é obrigatório. Target é obrigatório.'
    );
    expect(
      pt.formatValue(
        fmt.list({
          items: [1500, fmt.currency({ value: 10, currency: 'BRL' })],
        })
      )
    ).toBe('1.500 e R$\u00a010,00');
    expect(
      pt.formatValue(fmt.list({ items: [msg(messages.reason), 'B'] }))
    ).toBe('o orçamento acabou e B');
  });

  test('renderHtml escapes each list item but not the separators', () => {
    const ref = msg(messages.campaignList, {
      campaigns: fmt.list({
        items: [
          '<b>A</b>',
          msg(messages.paused, { campaign: 'B', reason: 'x' }),
        ],
      }),
    });

    expect(en.renderHtml(ref)).toBe(
      'Blocked by &lt;b&gt;A&lt;/b&gt; and Campaign B was <b>paused</b> because x..'
    );
  });

  test('a list survives JSON', () => {
    const ref = JSON.parse(
      JSON.stringify(
        msg(messages.campaignList, {
          campaigns: fmt.list({ items: [msg(messages.reason), 'B'] }),
        })
      )
    );

    expect(pt.render(ref)).toBe('Bloqueado por o orçamento acabou e B.');
  });

  test('renderHtml escapes values but not the message markup', () => {
    const ref = msg(messages.paused, {
      campaign: '<script>alert("x")</script>',
      reason: msg(messages.reason),
    });

    expect(en.renderHtml(ref)).toBe(
      'Campaign &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; was <b>paused</b> because its budget ran out.'
    );
    expect(en.render(ref)).toBe(
      'Campaign <script>alert("x")</script> was paused because its budget ran out.'
    );
  });

  test('renders void tags', () => {
    expect(en.render(msg(messages.lineBreak))).toBe('First\nSecond');
    expect(en.renderHtml(msg(messages.lineBreak))).toBe('First<br>Second');
  });

  test('keeps div and heading tags in html and drops them in text', () => {
    const ref = msg(messages.blocks, {
      amount: fmt.currency({ value: 5, currency: 'USD' }),
    });

    expect(en.renderHtml(ref)).toBe(
      '<h1>Report</h1><div>Spent $5.00</div><h2>A</h2><h3>B</h3><h4>C</h4><h5>D</h5><h6>E</h6>'
    );
    expect(en.render(ref)).toBe('ReportSpent $5.00ABCDE');
  });

  test('passes plain strings through, escaped for html', () => {
    expect(pt.render('Texto legado')).toBe('Texto legado');
    expect(pt.renderHtml('a < b & c')).toBe('a &lt; b &amp; c');
  });

  test('renders a reference that went through JSON', () => {
    const stored = JSON.parse(
      JSON.stringify(
        msg(messages.spent, {
          amount: fmt.currency({ value: 5, currency: 'BRL' }),
          date: fmt.date({ value: '2026-01-02T00:00:00Z', timeZone: 'UTC' }),
        })
      )
    );

    expect(pt.render(stored)).toBe('Você gastou R$\u00a05,00 em 02/01/2026.');
  });

  test('is still an IntlShape', () => {
    expect(pt.locale).toBe('pt-BR');
    expect(pt.formatMessage(messages.greeting, { name: 'Ana' })).toBe(
      'Olá, Ana!'
    );
  });
});

describe('isTranslated', () => {
  const pt = createI18n({ locale: 'pt-BR', messages: ptBR });

  test('is true when the catalog holds the reference', () => {
    expect(pt.isTranslated(msg(messages.greeting, { name: 'Ana' }))).toBe(true);
  });

  test('is false when the catalog lacks the id', () => {
    expect(pt.isTranslated(msg(messages.campaigns, { count: 2 }))).toBe(false);
  });

  test('checks nested references too', () => {
    const translated = msg(messages.paused, {
      campaign: 'Black Friday',
      reason: msg(messages.reason),
    });
    const untranslated = msg(messages.paused, {
      campaign: 'Black Friday',
      reason: msg(messages.optional, { note: 'x' }),
    });

    expect(pt.isTranslated(translated)).toBe(true);
    expect(pt.isTranslated(untranslated)).toBe(false);
  });

  test('checks references inside a list', () => {
    const translated = msg(messages.invalidFields, {
      failures: fmt.list({
        items: [msg(messages.required, { field: 'A' }), 'plain'],
      }),
    });
    const untranslated = msg(messages.invalidFields, {
      failures: fmt.list({
        items: [fmt.list({ items: [msg(messages.optional, { note: 'x' })] })],
      }),
    });

    expect(pt.isTranslated(translated)).toBe(true);
    expect(pt.isTranslated(untranslated)).toBe(false);
  });

  test('ignores values that are not references', () => {
    const ref = msg(messages.spent, {
      amount: fmt.currency({ value: 10, currency: 'BRL' }),
      date: '2026-09-28',
    });

    expect(pt.isTranslated(ref)).toBe(true);
  });

  test('treats a plain string as untranslated outside the source locale', () => {
    expect(pt.isTranslated('Hello')).toBe(false);
  });

  test('is always true in the source locale', () => {
    const source = createI18n({
      locale: 'pt-BR',
      defaultLocale: 'pt-br',
      messages: {},
    });

    expect(source.isTranslated(msg(messages.greeting, { name: 'Ana' }))).toBe(
      true
    );
    expect(source.isTranslated('Olá')).toBe(true);
  });

  test('works with a bare IntlShape, as react-intl provides', () => {
    expect(
      isMessageRefTranslated({
        intl: { locale: 'pt-BR', defaultLocale: 'en', messages: ptBR },
        ref: msg(messages.reason),
      })
    ).toBe(true);
  });
});

describe('negotiateLocale', () => {
  const supported = ['en', 'pt-BR', 'es'];

  test.each<[string | string[] | null | undefined, string]>([
    [undefined, 'pt-BR'],
    [null, 'pt-BR'],
    ['', 'pt-BR'],
    ['en', 'en'],
    ['EN-us', 'en'],
    ['pt-br', 'pt-BR'],
    ['pt', 'pt-BR'],
    ['pt-PT', 'pt-BR'],
    ['es-MX', 'es'],
    ['fr', 'pt-BR'],
    ['fr-CA,fr;q=0.9,es;q=0.8,en;q=0.7', 'es'],
    ['en;q=0.5, pt-BR', 'pt-BR'],
    ['*', 'pt-BR'],
    ['en;q=0', 'pt-BR'],
    ['not a locale!!, es', 'es'],
    [['fr', 'en'], 'en'],
  ])('%j → %s', (requested, expected) => {
    expect(negotiateLocale({ requested, supported, fallback: 'pt-BR' })).toBe(
      expected
    );
  });

  test('prefers a truncated exact match over another region', () => {
    expect(
      negotiateLocale({
        requested: 'pt-PT',
        supported: ['pt-BR', 'pt'],
        fallback: 'en',
      })
    ).toBe('pt');
  });

  test('returns undefined when nothing matches and no fallback is given', () => {
    expect(negotiateLocale({ requested: 'fr', supported })).toBeUndefined();
    expect(negotiateLocale({ requested: null, supported })).toBeUndefined();
  });

  test('still matches without a fallback', () => {
    expect(negotiateLocale({ requested: 'pt-PT', supported })).toBe('pt-BR');
  });
});

describe('createCatalog', () => {
  test('loads each negotiated locale once', async () => {
    const load = jest.fn((locale: string) => {
      return locale === 'pt-BR' ? ptBR : {};
    });
    const catalog = createCatalog({
      supported: ['en', 'pt-BR'],
      fallback: 'en',
      load,
    });

    const first = await catalog.getI18n('pt-BR,pt;q=0.9');
    const second = await catalog.getI18n('pt');
    const fallback = await catalog.getI18n(undefined);

    expect(first).toBe(second);
    expect(first.render(msg(messages.reason))).toBe('o orçamento acabou');
    expect(fallback.locale).toBe('en');
    expect(load).toHaveBeenCalledTimes(2);
    expect(catalog.negotiate('es')).toBe('en');
  });

  test('retries a load that failed', async () => {
    const load = jest
      .fn()
      .mockRejectedValueOnce(new Error('S3 is down'))
      .mockResolvedValueOnce(ptBR);
    const catalog = createCatalog({
      supported: ['pt-BR'],
      fallback: 'pt-BR',
      defaultLocale: 'pt-BR',
      load,
    });

    await expect(catalog.getI18n()).rejects.toThrow('S3 is down');

    const i18n = await catalog.getI18n();

    expect(i18n.render(msg(messages.greeting, { name: 'Ana' }))).toBe(
      'Olá, Ana!'
    );
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('LocalizedError', () => {
  const ref = msg(messages.accessLost, { account: 'Loja' });

  test('carries a code and a reference, with the source text as message', () => {
    const cause = new Error('OAuthException');
    const error = new LocalizedError({
      code: 'META_ACCESS_LOST',
      message: ref,
      cause,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('LocalizedError');
    expect(error.code).toBe('META_ACCESS_LOST');
    expect(error.message).toBe('We lost access to ad account Loja.');
    expect(error.messageRef).toBe(ref);
    expect(error.cause).toBe(cause);
  });

  test('omits cause when none is given', () => {
    expect('cause' in new LocalizedError({ code: 'X', message: ref })).toBe(
      false
    );
  });

  test('serializes to JSON with its reference', () => {
    const error = new LocalizedError({
      code: 'META_ACCESS_LOST',
      message: ref,
    });

    expect(JSON.parse(JSON.stringify(error))).toEqual({
      name: 'LocalizedError',
      code: 'META_ACCESS_LOST',
      message: 'We lost access to ad account Loja.',
      messageRef: ref,
    });
  });

  test('renders in the reader locale at the edge', () => {
    const error = new LocalizedError({
      code: 'META_ACCESS_LOST',
      message: ref,
    });
    const i18n = createI18n({
      locale: 'pt-BR',
      messages: {
        [messages.accessLost.id]:
          'Perdemos o acesso à conta de anúncios {account}.',
      },
    });

    expect(i18n.render(error.messageRef)).toBe(
      'Perdemos o acesso à conta de anúncios Loja.'
    );
  });

  test('isLocalizedError matches by shape, not by class', () => {
    class ForeignError extends Error {
      code = 'FOREIGN';

      messageRef = ref;
    }

    expect(
      isLocalizedError(new LocalizedError({ code: 'X', message: ref }))
    ).toBe(true);
    expect(isLocalizedError(new ForeignError())).toBe(true);
    expect(
      isLocalizedError(JSON.parse(JSON.stringify(new ForeignError())))
    ).toBe(true);
    expect(isLocalizedError(new Error('plain'))).toBe(false);
    expect(isLocalizedError({ code: 'X', messageRef: { id: 'x' } })).toBe(
      false
    );
    expect(isLocalizedError(undefined)).toBe(false);
  });
});

describe('renderLocalizedError', () => {
  const i18n = createI18n({
    locale: 'pt-BR',
    messages: {
      [messages.paused.id!]:
        'A campanha {campaign} foi <b>pausada</b> porque {reason}.',
      [messages.reason.id!]: 'o orçamento acabou',
    },
  });
  const error = new LocalizedError({
    code: 'CAMPAIGN_PAUSED',
    message: msg(messages.paused, {
      campaign: '<Loja>',
      reason: msg(messages.reason),
    }),
  });

  test('renders the code and the message in the reader locale', () => {
    expect(renderLocalizedError({ error, i18n })).toEqual({
      code: 'CAMPAIGN_PAUSED',
      message: 'A campanha <Loja> foi pausada porque o orçamento acabou.',
    });
    expect(renderLocalizedError({ error, i18n, mode: 'html' })).toEqual({
      code: 'CAMPAIGN_PAUSED',
      message:
        'A campanha &lt;Loja&gt; foi <b>pausada</b> porque o orçamento acabou.',
    });
  });

  test('leaves every other value alone', () => {
    expect(
      renderLocalizedError({ error: new Error('x'), i18n })
    ).toBeUndefined();
    expect(renderLocalizedError({ error: 'x', i18n })).toBeUndefined();
  });
});

describe('renderMessageRef', () => {
  test('renders with a bare IntlShape, as react-intl provides', () => {
    const {
      formatMessage,
      formatNumber,
      formatDate,
      formatRelativeTime,
      formatList,
    } = createI18n({ locale: 'en', messages: {} });

    expect(
      renderMessageRef({
        intl: {
          formatMessage,
          formatNumber,
          formatDate,
          formatRelativeTime,
          formatList,
        },
        ref: msg(messages.greeting, { name: 'Ana' }),
        mode: 'text',
      })
    ).toBe('Hello, Ana!');
  });
});
