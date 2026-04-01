type WhatsAppMessageOptions = {
  to: string;
  body: string;
  companyChannel?: {
    provider?: string | null;
    phone_number_id?: string | null;
    access_token?: string | null;
    from_number?: string | null;
    twilio_account_sid?: string | null;
    twilio_auth_token?: string | null;
    status?: string | null;
  } | null;
};

function digitsOnly(value: string) {
  return value.replace(/[^\d]/g, '');
}

export async function sendWhatsAppMessage(options: WhatsAppMessageOptions) {
  const provider = options.companyChannel?.provider || process.env.WHATSAPP_PROVIDER || 'meta';
  const to = digitsOnly(options.to);
  if (!to) throw new Error('Número de destino inválido para WhatsApp.');

  if (provider === 'twilio') {
    const accountSid = options.companyChannel?.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID;
    const authToken = options.companyChannel?.twilio_auth_token || process.env.TWILIO_AUTH_TOKEN;
    const from = options.companyChannel?.from_number || process.env.TWILIO_WHATSAPP_FROM;
    if (!accountSid || !authToken || !from) {
      throw new Error('Faltan credenciales de Twilio WhatsApp.');
    }

    const params = new URLSearchParams();
    params.set('To', `whatsapp:+${to}`);
    params.set('From', from.startsWith('whatsapp:') ? from : `whatsapp:${from}`);
    params.set('Body', options.body);

    const basic = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'No se pudo enviar WhatsApp por Twilio.');
    return { provider: 'twilio', id: data.sid };
  }

  const phoneNumberId = options.companyChannel?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = options.companyChannel?.access_token || process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    throw new Error('Faltan credenciales de WhatsApp Cloud API.');
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: options.body.slice(0, 4096) },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = data?.error?.message || 'No se pudo enviar WhatsApp por Meta.';
    throw new Error(detail);
  }

  return { provider: 'meta', id: data?.messages?.[0]?.id || null };
}
