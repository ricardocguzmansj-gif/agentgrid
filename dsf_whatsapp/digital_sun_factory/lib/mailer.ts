import { Resend } from 'resend';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    return { simulated: true };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: process.env.LEADS_FROM_EMAIL || 'Digital Sun <noreply@example.com>',
    to,
    subject,
    html,
  });
}

export function buildLeadFollowupEmail(firstName: string) {
  return {
    subject: 'Tu demo de agentes de IA está lista',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Hola ${firstName},</h2>
        <p>Gracias por tu interés en Digital Sun SaaS Factory.</p>
        <p>Ya tenemos lista una demo para mostrarte cómo automatizar atención, ventas y seguimiento comercial con agentes de IA.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/demo" style="display:inline-block;padding:12px 18px;background:#111827;color:#fff;border-radius:12px;text-decoration:none">Ver demo ahora</a></p>
        <p>Si querés, también podés responder este email para coordinar una demo personalizada.</p>
      </div>
    `,
  };
}
