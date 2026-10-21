import {
  render,
  renderHook,
  setOptions,
  setUserEventOptions,
  userEvent,
} from '../../src/react';

test('methods should exist', () => {
  expect(render).toBeDefined();
  expect(renderHook).toBeDefined();
  expect(setOptions).toBeDefined();
  expect(setUserEventOptions).toBeDefined();
  expect(userEvent).toBeDefined();
});

test('should define window.matchMedia', () => {
  expect(window.matchMedia).toBeDefined();
});

describe('setUserEventOptions', () => {
  // user-event awaits a `setTimeout` between actions unless `delay` is null,
  // so the timers a typing schedules show which delay `setup()` received.
  const timersScheduledWhileTyping = async (
    user: ReturnType<typeof userEvent.setup>
  ) => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    await user.type(input, 'abc');

    const calls = setTimeoutSpy.mock.calls.length;
    setTimeoutSpy.mockRestore();
    expect(input).toHaveValue('abc');
    return calls;
  };

  afterEach(() => {
    setUserEventOptions({});
    document.body.innerHTML = '';
  });

  test('setup() keeps the user-event default delay when no options are set', async () => {
    const withoutDelay = await timersScheduledWhileTyping(
      userEvent.setup({ delay: null })
    );

    await expect(
      timersScheduledWhileTyping(userEvent.setup())
    ).resolves.toBeGreaterThan(withoutDelay);
  });

  test('setup() applies the options set by setUserEventOptions', async () => {
    const withoutDelay = await timersScheduledWhileTyping(
      userEvent.setup({ delay: null })
    );
    setUserEventOptions({ delay: null });

    await expect(timersScheduledWhileTyping(userEvent.setup())).resolves.toBe(
      withoutDelay
    );
  });

  test('options passed to setup() take precedence', async () => {
    setUserEventOptions({ delay: null });
    const withoutDelay = await timersScheduledWhileTyping(userEvent.setup());

    await expect(
      timersScheduledWhileTyping(userEvent.setup({ delay: 0 }))
    ).resolves.toBeGreaterThan(withoutDelay);
  });

  test('keeps the direct APIs of user-event', () => {
    expect(userEvent.click).toBeDefined();
    expect(userEvent.type).toBeDefined();
  });
});
