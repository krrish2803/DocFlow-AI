const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!EMAIL_RE.test(email)) return 'Invalid email format';
  if (email.length > 254) return 'Email is too long';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (password.length > 128) return 'Password must be at most 128 characters';
  return null;
}

export function validateName(name: string): string | null {
  if (!name || !name.trim()) return 'Name is required';
  if (name.length > 100) return 'Name is too long';
  return null;
}

export function validateUrl(url: string): string | null {
  if (!url) return null;
  try {
    new URL(url);
    return null;
  } catch {
    return 'Invalid URL format';
  }
}
