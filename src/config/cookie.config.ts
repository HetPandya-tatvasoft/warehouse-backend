import type { CookieOptions } from 'express';

const createCookieOptions = (options: CookieOptions): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  ...options,
});

export const ACCESS_COOKIE_OPTIONS = createCookieOptions({
  maxAge: 15 * 60 * 1000,
});

export const REFRESH_COOKIE_OPTIONS = createCookieOptions({
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
