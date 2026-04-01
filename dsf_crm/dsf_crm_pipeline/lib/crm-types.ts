export type CRMConversation = {
  id: string
  company_id: string
  contact_name: string | null
  contact_phone: string | null
  channel: string
  status: string
  assigned_user_id: string | null
  stage_id: string | null
  last_message_at: string | null
  created_at: string
  updated_at: string
}

export type CRMMessage = {
  id: string
  conversation_id: string
  direction: 'inbound' | 'outbound'
  content: string
  created_at: string
}

export type CRMOperator = {
  user_id: string
  role: string
  full_name: string | null
  email: string | null
}

export type CRMTag = {
  id: string
  name: string
  color: string | null
}

export type CRMNote = {
  id: string
  conversation_id: string
  body: string
  created_at: string
  author_user_id: string | null
}

export type CRMStage = {
  id: string
  pipeline_id: string
  name: string
  sort_order: number
  is_closed_won: boolean
  is_closed_lost: boolean
}

export type CRMOpportunity = {
  id: string
  conversation_id: string
  title: string
  amount: number | null
  currency: string | null
  stage_id: string | null
  owner_user_id: string | null
  expected_close_at: string | null
  created_at: string
}
