import OpenAI from 'openai';

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Falta OPENAI_API_KEY en el entorno.');
  }
  return new OpenAI({ apiKey });
}

export async function generateAIResponse(options: {
  systemPrompt: string;
  input: string;
  model?: string;
  temperature?: number;
}) {
  const client = getOpenAIClient();
  const response = await client.responses.create({
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    instructions: options.systemPrompt,
    input: options.input,
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.3,
    max_output_tokens: 1200,
  });

  return {
    id: response.id,
    text: response.output_text || '',
    model: response.model,
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
  };
}
