const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string): string | null => {
  if (!value) {
    return 'Enter your email.';
  }
  if (!EMAIL_PATTERN.test(value)) {
    return 'Enter a valid email address.';
  }
  return null;
};

export const validatePassword = (value: string): string | null => {
  if (!value) {
    return 'Enter your password.';
  }
  if (value.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  return null;
};
