export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Industry = 'general' | 'ecommerce' | 'clinic' | 'real_estate' | 'education'

export interface Company {
  id: string
  name: string
  slug: string
  industry: Industry
  brand_primary: string | null
  brand_secondary: string | null
  support_email: string | null
  created_at: string
}

export interface CompanyMembership {
  company_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
}

export interface AiAgent {
  id: string
  company_id: string
  name: string
  niche: Industry
  system_prompt: string
  is_active: boolean
}

export interface AutomationWorkflow {
  id: string
  company_id: string
  name: string
  channel: 'email' | 'whatsapp'
  prompt_template: string
  cron_schedule: string
  is_active: boolean
}
