import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export async function sendEmailReport(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const response = await resend.emails.send({
      from: process.env.REPORTS_FROM_EMAIL || 'reportes@example.com',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return { provider: 'resend', response };
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Falta configuración de email: RESEND_API_KEY o SMTP_*');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.REPORTS_FROM_EMAIL || process.env.SMTP_USER,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  return { provider: 'smtp', response: info };
}
