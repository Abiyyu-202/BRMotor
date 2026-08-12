-- Demo users from the existing Laravel schema use password: 123.
-- Hash generated with bcrypt cost 12; change these credentials before production.
UPDATE users
SET password = '$2b$12$gstim/XtdyTiZut53RQjdu2.6RgkfPmD3Fz7.2taz8F9g.3DgJPrG',
    updated_at = NOW()
WHERE email IN (
  'admin@brmotor.com',
  'owner@brmotor.com',
  'mechanic@brmotor.com',
  'cashier@brmotor.com',
  'customer@brmotor.com'
);
