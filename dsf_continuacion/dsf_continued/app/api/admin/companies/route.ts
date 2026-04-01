import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase'
import { buildSystemPrompt } from '@/lib/agent-templates'

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  industry: z.enum(['general', 'ecommerce', 'clinic', 'real_estate', 'education']),
  ownerEmail: z.string().email(),
  brandPrimary: z.string().optional(),
  brandSecondary: z.string().optional(),
  supportEmail: z.string().email().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json())
    const supabase = getSupabaseAdmin()

    const { data: profile } = await supabase
      .from('profiles')
      .select('id,email,platform_role')
      .eq('email', body.ownerEmail)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Owner email not found in profiles' }, { status: 404 })
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: body.name,
        slug: body.slug,
        industry: body.industry,
        brand_primary: body.brandPrimary || '#58a6ff',
        brand_secondary: body.brandSecondary || '#07111f',
        support_email: body.supportEmail || body.ownerEmail
      })
      .select('*')
      .single()

    if (companyError) throw companyError

    const { error: membershipError } = await supabase.from('company_memberships').insert({
      company_id: company.id,
      user_id: profile.id,
      role: 'owner'
    })

    if (membershipError) throw membershipError

    const { error: agentError } = await supabase.from('ai_agents').insert({
      company_id: company.id,
      name: `${body.name} Sales Agent`,
      niche: body.industry,
      system_prompt: buildSystemPrompt(body.industry, body.name),
      is_active: true
    })

    if (agentError) throw agentError

    return NextResponse.json({ ok: true, company })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
