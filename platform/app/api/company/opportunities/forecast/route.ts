import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase'
import { getCurrentCompanyIdOrThrow } from '@/lib/company'

export async function GET() {
  try {
    const companyId = await getCurrentCompanyIdOrThrow()
    const supabase = getSupabaseAdminClient()

    // 1. Get opportunities from crm_opportunities
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select('*, stage:sales_stages(name)')
      .eq('company_id', companyId)

    if (error) throw error

    // 2. Map stages and filter
    const STAGE_MAP: Record<string, string> = {
      'nuevo lead': 'new',
      'calificado': 'qualified',
      'propuesta enviada': 'proposal',
      'negociación': 'negotiation',
      'ganado': 'won',
      'perdido': 'lost',
    };

    const mappedData = (data || []).map((row: any) => {
      const dbStageName = row.stage?.name?.toLowerCase() || ''
      return {
        ...row,
        stage: STAGE_MAP[dbStageName] || 'new',
        probability: row.probability || 0,
      }
    })

    const openItems = mappedData.filter((row: any) => !['won', 'lost'].includes(row.stage))

    const totalOpenAmount = openItems.reduce((acc: number, row: any) => acc + Number(row.amount || 0), 0)
    const weightedForecastAmount = openItems.reduce(
      (acc: number, row: any) => acc + Number(row.amount || 0) * (Number(row.probability || 0) / 100),
      0,
    )

    const byStageMap = new Map<string, { stage: string; amount: number; weighted_amount: number; count: number }>()
    const byOwnerMap = new Map<string, { owner_user_id: string | null; owner_name: string | null; amount: number; weighted_amount: number; count: number }>()

    for (const row of openItems as any[]) {
      const stageKey = row.stage || 'unknown'
      const stageEntry = byStageMap.get(stageKey) || { stage: stageKey, amount: 0, weighted_amount: 0, count: 0 }
      stageEntry.amount += Number(row.amount || 0)
      stageEntry.weighted_amount += Number(row.amount || 0) * (Number(row.probability || 0) / 100)
      stageEntry.count += 1
      byStageMap.set(stageKey, stageEntry)

      const ownerKey = row.owner_user_id || 'unassigned'
      const ownerEntry = byOwnerMap.get(ownerKey) || {
        owner_user_id: row.owner_user_id || null,
        owner_name: null,
        amount: 0,
        weighted_amount: 0,
        count: 0,
      }
      ownerEntry.amount += Number(row.amount || 0)
      ownerEntry.weighted_amount += Number(row.amount || 0) * (Number(row.probability || 0) / 100)
      ownerEntry.count += 1
      byOwnerMap.set(ownerKey, ownerEntry)
    }

    const ownerIds = Array.from(new Set(openItems.map((row: any) => row.owner_user_id).filter(Boolean)))
    if (ownerIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id,full_name,email').in('id', ownerIds)
      const lookup = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.full_name || p.email || 'Operador']))
      byOwnerMap.forEach((value) => {
        value.owner_name = value.owner_user_id ? lookup[value.owner_user_id] || 'Operador' : 'Sin asignar'
      })
    } else {
      byOwnerMap.forEach((value) => {
        value.owner_name = 'Sin asignar'
      })
    }

    return NextResponse.json({
      total_open_amount: totalOpenAmount,
      weighted_forecast_amount: weightedForecastAmount,
      by_stage: Array.from(byStageMap.values()).sort((a, b) => b.weighted_amount - a.weighted_amount),
      by_owner: Array.from(byOwnerMap.values()).sort((a, b) => b.weighted_amount - a.weighted_amount),
    })
  } catch (error: any) {
    console.error('[Forecast API Error]', error)
    return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status: 500 })
  }
}
