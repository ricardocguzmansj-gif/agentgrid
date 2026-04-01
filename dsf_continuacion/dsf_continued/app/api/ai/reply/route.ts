import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateReply } from '@/lib/openai'

const schema = z.object({
  system: z.string().min(10),
  user: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json())
    const text = await generateReply(body)
    return NextResponse.json({ ok: true, text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
