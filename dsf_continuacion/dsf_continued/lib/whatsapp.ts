import { z } from 'zod'

const outboundSchema = z.object({
  phoneNumberId: z.string().min(3),
  accessToken: z.string().min(10),
  to: z.string().min(5),
  body: z.string().min(1)
})

export async function sendWhatsAppText(payload: z.infer<typeof outboundSchema>) {
  const parsed = outboundSchema.parse(payload)
  const url = `https://graph.facebook.com/v23.0/${parsed.phoneNumberId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${parsed.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: parsed.to,
      type: 'text',
      text: { body: parsed.body }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`WhatsApp API error: ${response.status} ${errorText}`)
  }

  return response.json()
}

export function extractInboundMessages(payload: any) {
  const entries = payload?.entry ?? []
  const result: Array<{ phoneNumberId: string; from: string; text: string; raw: unknown }> = []

  for (const entry of entries) {
    for (const change of entry?.changes ?? []) {
      const value = change?.value
      const metadata = value?.metadata
      const phoneNumberId = metadata?.phone_number_id
      const messages = value?.messages ?? []
      for (const msg of messages) {
        if (msg?.type === 'text' && msg?.text?.body && phoneNumberId) {
          result.push({
            phoneNumberId,
            from: msg.from,
            text: msg.text.body,
            raw: msg
          })
        }
      }
    }
  }

  return result
}
