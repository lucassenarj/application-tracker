import { doubleCsrf } from 'csrf-csrf';

const isDev = process.env.NODE_ENV !== 'production';

export const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET ?? '',
  getSessionIdentifier: (req) =>
    (req.cookies?.refreshToken as string | undefined) ?? '',
  cookieName: 'csrfToken',
  cookieOptions: {
    httpOnly: true,
    secure: !isDev,
    sameSite: 'strict',
  },
});
