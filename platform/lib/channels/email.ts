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
      from: process.env.RESEND_FROM_EMAIL || process.env.REPORTS_FROM_EMAIL || 'notificaciones@turnos.publicalogratis.com',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    return { provider: 'resend', response };
  }

  throw new Error('Falta configuración de email: RESEND_API_KEY');
}
