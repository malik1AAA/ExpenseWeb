import { timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';

const isAuthorized = (authorization, configuredSecret) => {
  const expected = Buffer.from(`Bearer ${configuredSecret}`);
  const received = Buffer.from(authorization || '');
  return received.length === expected.length && timingSafeEqual(received, expected);
};

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const secret = process.env.MAILER_SHARED_SECRET;
  if (!secret) {
    return response.status(503).json({ error: 'SMTP mail service is not configured.' });
  }
  if (secret.length < 32) {
    return response.status(503).json({ error: 'MAILER_SHARED_SECRET must be at least 32 characters.' });
  }
  if (!isAuthorized(request.headers.authorization, secret)) {
    return response.status(401).json({ error: 'Authentication required.' });
  }

  const {
    SMTP_HOST = 'smtp.gmail.com',
    SMTP_PORT = '587',
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM_EMAIL,
    SMTP_FROM_NAME = 'ExpenseWeb',
  } = process.env;
  const port = Number(SMTP_PORT);
  if (!SMTP_USER || !SMTP_PASS || !Number.isInteger(port) || port < 1 || port > 65535) {
    return response.status(503).json({ error: 'SMTP settings are incomplete or invalid.' });
  }

  const { to: requestedRecipients, subject, text, html } = request.body || {};
  const recipients = Array.isArray(requestedRecipients) ? requestedRecipients : [requestedRecipients];
  const to = recipients.length === 1 ? recipients[0] : null;
  if (
    typeof to !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
    typeof subject !== 'string' ||
    !subject.trim() ||
    typeof text !== 'string' ||
    typeof html !== 'string' ||
    subject.length > 500 ||
    text.length > 20000 ||
    html.length > 40000
  ) {
    return response.status(400).json({ error: 'A valid recipient and message are required.' });
  }

  const secure = SMTP_SECURE === undefined ? port === 465 : SMTP_SECURE === 'true';
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: { name: SMTP_FROM_NAME, address: SMTP_FROM_EMAIL || SMTP_USER },
      to,
      subject,
      text,
      html,
    });
    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('SMTP delivery failed:', error);
    return response.status(502).json({
      error: 'Gmail SMTP could not deliver this email. Check the SMTP host, port, sender and Google App Password.',
    });
  } finally {
    transporter.close();
  }
}
