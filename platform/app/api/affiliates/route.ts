import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const runtime = 'edge';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32);
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const affiliateCode = `${slugify(payload.name)}-${Math.random().toString(36).slice(2, 8)}`;

    const { error } = await supabase.from('affiliates').insert({
      name: payload.name,
      email: payload.email,
      affiliate_code: affiliateCode,
      commission_rate: 0.30,
      status: 'active',
    });

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.CF_PAGES_URL || 'http://localhost:3000';
    return NextResponse.json({
      ok: true,
      affiliateCode,
      referralUrl: `${baseUrl}/?ref=${affiliateCode}`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'No se pudo crear el afiliado.' }, { status: 400 });
  }
}
