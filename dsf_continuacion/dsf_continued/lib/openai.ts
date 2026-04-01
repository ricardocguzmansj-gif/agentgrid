import OpenAI from 'openai'

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('Missing OPENAI_API_KEY')
  return new OpenAI({ apiKey })
}

export async function generateReply(input: { system: string; user: string }) {
  const client = getOpenAI()
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const response = await client.responses.create({
    model,
    input: [
      { role: 'system', content: input.system },
      { role: 'user', content: input.user }
    ]
  })

  return response.output_text || 'No response generated.'
}
