type TplArgs = { link: string; email: string };
type TplOutput = { subject: string; html: string; text: string };

export const defaultMagicLinkEmail = ({ link }: TplArgs): TplOutput => {
  return {
    subject: 'Your sign-in link',
    html: `<p>Click <a href="${link}">here</a> to sign in. This link expires in 24 hours.</p>`,
    text: `Sign in: ${link}\n\nThis link expires in 24 hours.`,
  };
};

export const defaultVerifyEmail = ({ link }: TplArgs): TplOutput => {
  return {
    subject: 'Verify your email address',
    html: `<p>Click <a href="${link}">here</a> to verify your email address.</p>`,
    text: `Verify your email: ${link}`,
  };
};

export const defaultResetPasswordEmail = ({ link }: TplArgs): TplOutput => {
  return {
    subject: 'Reset your password',
    html: `<p>Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    text: `Reset your password: ${link}\n\nThis link expires in 1 hour.`,
  };
};
