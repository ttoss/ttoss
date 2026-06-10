export type EmailBranding = {
  appName: string;
  brandColor?: string;
  logoUrl?: string;
  supportEmail?: string;
};

type EmailTemplateArgs = {
  branding: EmailBranding;
  link: string;
  expiresInHours?: number;
};

type EmailOutput = {
  subject: string;
  html: string;
  text: string;
};

const baseHtml = ({
  branding,
  title,
  bodyHtml,
}: {
  branding: EmailBranding;
  title: string;
  bodyHtml: string;
}): string => {
  const color = branding.brandColor ?? '#0070f3';
  const footer = branding.supportEmail
    ? `<p style="color:#888;font-size:12px">Need help? Contact us at <a href="mailto:${branding.supportEmail}">${branding.supportEmail}</a></p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
  ${branding.logoUrl ? `<img src="${branding.logoUrl}" alt="${branding.appName}" style="height:40px;margin-bottom:16px">` : `<h2 style="color:${color}">${branding.appName}</h2>`}
  ${bodyHtml}
  ${footer}
</body>
</html>`;
};

export const magicLinkEmail = ({
  branding,
  link,
  expiresInHours = 24,
}: EmailTemplateArgs): EmailOutput => {
  const subject = `Sign in to ${branding.appName}`;
  const html = baseHtml({
    branding,
    title: subject,
    bodyHtml: `
  <p>Click the button below to sign in to ${branding.appName}. This link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.</p>
  <p><a href="${link}" style="display:inline-block;background:${branding.brandColor ?? '#0070f3'};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Sign in</a></p>
  <p style="color:#888;font-size:12px">If you didn't request this, you can safely ignore this email.</p>`,
  });
  const text = `Sign in to ${branding.appName}\n\n${link}\n\nThis link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.\n\nIf you didn't request this, you can safely ignore this email.`;
  return { subject, html, text };
};

export const verifyEmailEmail = ({
  branding,
  link,
  expiresInHours = 24,
}: EmailTemplateArgs): EmailOutput => {
  const subject = `Verify your email address for ${branding.appName}`;
  const html = baseHtml({
    branding,
    title: subject,
    bodyHtml: `
  <p>Please verify your email address to complete your ${branding.appName} registration. This link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.</p>
  <p><a href="${link}" style="display:inline-block;background:${branding.brandColor ?? '#0070f3'};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Verify email</a></p>
  <p style="color:#888;font-size:12px">If you didn't create an account, you can safely ignore this email.</p>`,
  });
  const text = `Verify your email for ${branding.appName}\n\n${link}\n\nThis link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.`;
  return { subject, html, text };
};

export const resetPasswordEmail = ({
  branding,
  link,
  expiresInHours = 1,
}: EmailTemplateArgs): EmailOutput => {
  const subject = `Reset your ${branding.appName} password`;
  const html = baseHtml({
    branding,
    title: subject,
    bodyHtml: `
  <p>You requested a password reset for your ${branding.appName} account. Click the button below to set a new password. This link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.</p>
  <p><a href="${link}" style="display:inline-block;background:${branding.brandColor ?? '#0070f3'};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Reset password</a></p>
  <p style="color:#888;font-size:12px">If you didn't request a password reset, you can safely ignore this email.</p>`,
  });
  const text = `Reset your ${branding.appName} password\n\n${link}\n\nThis link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.\n\nIf you didn't request this, you can safely ignore this email.`;
  return { subject, html, text };
};
