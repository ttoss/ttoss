import { createTikTokClient } from 'src/index';

describe('createTikTokClient', () => {
  test('encodes TikTok deviations in the authorization URL', () => {
    const client = createTikTokClient({
      clientKey: 'tk-key',
      clientSecret: 'tk-secret',
    });

    const url = new URL(
      client.buildAuthUrl({
        redirectUri: 'https://app.example/my/settings/social',
        scope: ['user.info.basic', 'video.publish'],
        state: 'state-123',
      })
    );

    expect(url.origin + url.pathname).toBe(
      'https://www.tiktok.com/v2/auth/authorize/'
    );
    expect(url.searchParams.get('client_key')).toBe('tk-key');
    expect(url.searchParams.has('client_id')).toBe(false);
    expect(url.searchParams.get('scope')).toBe('user.info.basic,video.publish');
  });

  test('sends client_key to the TikTok token endpoint and exposes open_id on raw', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => {
        return {
          access_token: 'act',
          refresh_token: 'rft',
          expires_in: 86_400,
          open_id: 'open-id-1',
        };
      },
      text: async () => {
        return '';
      },
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = createTikTokClient({
      clientKey: 'tk-key',
      clientSecret: 'tk-secret',
    });

    const result = await client.exchangeCode({
      code: 'code',
      redirectUri: 'https://app.example/my/settings/social',
    });

    const [tokenUrl, init] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe('https://open.tiktokapis.com/v2/oauth/token/');
    expect((init.body as URLSearchParams).get('client_key')).toBe('tk-key');
    expect(result.raw.open_id).toBe('open-id-1');

    jest.restoreAllMocks();
  });
});
