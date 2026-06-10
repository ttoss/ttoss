import {
  magicLinkEmail,
  resetPasswordEmail,
  verifyEmailEmail,
} from 'src/emails';

const branding = {
  appName: 'TestApp',
  brandColor: '#123456',
  supportEmail: 'support@testapp.com',
};

describe('magicLinkEmail', () => {
  test('includes link in output', () => {
    const { html, text } = magicLinkEmail({
      branding,
      link: 'https://example.com/magic',
    });
    expect(html).toContain('https://example.com/magic');
    expect(text).toContain('https://example.com/magic');
  });

  test('includes app name in subject', () => {
    const { subject } = magicLinkEmail({ branding, link: 'https://x.com' });
    expect(subject).toContain('TestApp');
  });

  test('includes expiry in output', () => {
    const { html, text } = magicLinkEmail({
      branding,
      link: 'https://x.com',
      expiresInHours: 2,
    });
    expect(html).toContain('2 hours');
    expect(text).toContain('2 hours');
  });

  test('uses singular hour when expiresInHours is 1', () => {
    const { html } = magicLinkEmail({
      branding,
      link: 'https://x.com',
      expiresInHours: 1,
    });
    expect(html).toContain('1 hour');
    expect(html).not.toContain('1 hours');
  });

  test('includes brand color in HTML', () => {
    const { html } = magicLinkEmail({ branding, link: 'https://x.com' });
    expect(html).toContain('#123456');
  });

  test('includes support email in HTML', () => {
    const { html } = magicLinkEmail({ branding, link: 'https://x.com' });
    expect(html).toContain('support@testapp.com');
  });
});

describe('verifyEmailEmail', () => {
  test('includes link in output', () => {
    const { html, text } = verifyEmailEmail({
      branding,
      link: 'https://example.com/verify',
    });
    expect(html).toContain('https://example.com/verify');
    expect(text).toContain('https://example.com/verify');
  });

  test('includes app name in subject', () => {
    const { subject } = verifyEmailEmail({ branding, link: 'https://x.com' });
    expect(subject).toContain('TestApp');
  });

  test('works without logoUrl', () => {
    const { html } = verifyEmailEmail({
      branding: { appName: 'NoLogo' },
      link: 'https://x.com',
    });
    expect(html).toContain('NoLogo');
  });

  test('uses logoUrl when provided', () => {
    const { html } = verifyEmailEmail({
      branding: { ...branding, logoUrl: 'https://cdn.example.com/logo.png' },
      link: 'https://x.com',
    });
    expect(html).toContain('https://cdn.example.com/logo.png');
  });
});

describe('resetPasswordEmail', () => {
  test('includes link in output', () => {
    const { html, text } = resetPasswordEmail({
      branding,
      link: 'https://example.com/reset',
    });
    expect(html).toContain('https://example.com/reset');
    expect(text).toContain('https://example.com/reset');
  });

  test('defaults to 1 hour expiry', () => {
    const { html } = resetPasswordEmail({ branding, link: 'https://x.com' });
    expect(html).toContain('1 hour');
  });

  test('includes app name in subject', () => {
    const { subject } = resetPasswordEmail({ branding, link: 'https://x.com' });
    expect(subject).toContain('TestApp');
  });
});
