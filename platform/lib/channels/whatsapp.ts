export async function sendWhatsAppReport(params: {
  to: string;
  body: string;
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || 'v23.0';

  if (!token || !phoneNumberId) {
    throw new Error('Falta configuración de WhatsApp: WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID');
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'text',
      text: { body: params.body.slice(0, 4096) },
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error?.message || 'No se pudo enviar WhatsApp');
  }

  return { provider: 'meta_whatsapp', response: json };
}
