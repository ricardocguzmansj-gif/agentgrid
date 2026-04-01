'use client'

import { useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase-browser'
import type { CRMConversation, CRMMessage, CRMNote, CRMOperator, CRMOpportunity, CRMStage, CRMTag } from '@/lib/crm-types'

type SummaryPayload = {
  conversations: CRMConversation[]
  operators: CRMOperator[]
  tags: CRMTag[]
  stages: CRMStage[]
}

type DetailPayload = {
  messages: CRMMessage[]
  notes: CRMNote[]
  tags: CRMTag[]
  opportunity: CRMOpportunity | null
}

export default function AdvancedConversationsCRM() {
  const supabase = useMemo(() => getSupabaseBrowser(), [])
  const [summary, setSummary] = useState<SummaryPayload>({ conversations: [], operators: [], tags: [], stages: [] })
  const [selectedId, setSelectedId] = useState<string>('')
  const [detail, setDetail] = useState<DetailPayload>({ messages: [], notes: [], tags: [], opportunity: null })
  const [draft, setDraft] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [opportunityTitle, setOpportunityTitle] = useState('')
  const [opportunityAmount, setOpportunityAmount] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadSummary() {
    const res = await fetch('/api/company/conversations', { cache: 'no-store' })
    const json = await res.json()
    const payload: SummaryPayload = {
      conversations: json.conversations ?? [],
      operators: json.operators ?? [],
      tags: json.tags ?? [],
      stages: json.stages ?? [],
    }
    setSummary(payload)
    if (!selectedId && payload.conversations[0]?.id) {
      setSelectedId(payload.conversations[0].id)
    }
    setLoading(false)
  }

  async function loadDetail(conversationId: string) {
    const res = await fetch(`/api/company/conversations?conversationId=${conversationId}`, { cache: 'no-store' })
    const json = await res.json()
    setDetail({
      messages: json.messages ?? [],
      notes: json.notes ?? [],
      tags: json.tags ?? [],
      opportunity: json.opportunity ?? null,
    })
    if (json.opportunity?.title) setOpportunityTitle(json.opportunity.title)
    if (json.opportunity?.amount != null) setOpportunityAmount(String(json.opportunity.amount))
  }

  async function sendMessage() {
    if (!selectedId || !draft.trim()) return
    const content = draft.trim()
    setDraft('')
    await fetch('/api/company/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: selectedId, content }),
    })
    await loadDetail(selectedId)
    await loadSummary()
  }

  async function saveAssignment(assignedUserId: string) {
    if (!selectedId) return
    await fetch(`/api/company/conversations/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_user_id: assignedUserId || null }),
    })
    await loadSummary()
  }

  async function saveStage(stageId: string) {
    if (!selectedId) return
    await fetch(`/api/company/conversations/${selectedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId || null }),
    })
    await loadSummary()
  }

  async function addNote() {
    if (!selectedId || !noteDraft.trim()) return
    await fetch(`/api/company/conversations/${selectedId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: noteDraft.trim() }),
    })
    setNoteDraft('')
    await loadDetail(selectedId)
  }

  async function createTag() {
    if (!tagDraft.trim()) return
    const res = await fetch('/api/company/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tagDraft.trim() }),
    })
    const json = await res.json()
    setTagDraft('')
    await loadSummary()
    if (selectedId && json.tag?.id) {
      await toggleTag(json.tag.id, true)
    }
  }

  async function toggleTag(tagId: string, forceAdd?: boolean) {
    if (!selectedId) return
    const selected = detail.tags.some((t) => t.id === tagId)
    await fetch(`/api/company/conversations/${selectedId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId, action: forceAdd || !selected ? 'add' : 'remove' }),
    })
    await loadDetail(selectedId)
  }

  async function saveOpportunity() {
    if (!selectedId || !opportunityTitle.trim()) return
    await fetch('/api/company/opportunities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selectedId,
        title: opportunityTitle.trim(),
        amount: opportunityAmount ? Number(opportunityAmount) : null,
      }),
    })
    await loadDetail(selectedId)
  }

  useEffect(() => {
    loadSummary()
  }, [])

  useEffect(() => {
    if (selectedId) loadDetail(selectedId)
  }, [selectedId])

  useEffect(() => {
    const channel = supabase
      .channel('crm-pipeline-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadSummary()
        if (selectedId) loadDetail(selectedId)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        loadSummary()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_notes' }, () => {
        if (selectedId) loadDetail(selectedId)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, selectedId])

  const selectedConversation = summary.conversations.find((item) => item.id === selectedId)
  const selectedStageId = selectedConversation?.stage_id ?? ''
  const assignedUserId = selectedConversation?.assigned_user_id ?? ''

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr_360px]">
      <aside className="rounded-2xl border border-zinc-800 bg-zinc-950">
        <div className="border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold">Conversaciones</h2>
          <p className="text-sm text-zinc-400">Inbox comercial y soporte</p>
        </div>
        <div className="max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-zinc-400">Cargando…</div>
          ) : summary.conversations.length === 0 ? (
            <div className="p-4 text-sm text-zinc-500">No hay conversaciones todavía.</div>
          ) : (
            summary.conversations.map((conversation) => {
              const stage = summary.stages.find((item) => item.id === conversation.stage_id)
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedId(conversation.id)}
                  className={`w-full border-b border-zinc-900 px-4 py-3 text-left transition ${selectedId === conversation.id ? 'bg-zinc-900' : 'hover:bg-zinc-900/60'}`}
                >
                  <div className="font-medium text-white">{conversation.contact_name || conversation.contact_phone || 'Sin nombre'}</div>
                  <div className="mt-1 text-xs text-zinc-400">{conversation.contact_phone || 'Sin teléfono'} · {conversation.channel}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-300">
                      {conversation.status}
                    </span>
                    {stage ? (
                      <span className="rounded-full border border-emerald-700/60 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
                        {stage.name}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <section className="flex min-h-[75vh] flex-col rounded-2xl border border-zinc-800 bg-zinc-950">
        <div className="border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold">{selectedConversation?.contact_name || selectedConversation?.contact_phone || 'Seleccioná una conversación'}</h2>
          <p className="text-sm text-zinc-400">Chat en vivo y respuesta manual</p>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {detail.messages.length === 0 ? (
            <div className="text-sm text-zinc-500">Todavía no hay mensajes.</div>
          ) : (
            detail.messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${message.direction === 'outbound' ? 'ml-auto bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-100'}`}
              >
                <div>{message.content}</div>
                <div className={`mt-2 text-[11px] ${message.direction === 'outbound' ? 'text-emerald-100/80' : 'text-zinc-500'}`}>
                  {new Date(message.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-zinc-800 p-4">
          <div className="flex gap-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              placeholder="Escribí una respuesta manual…"
              className="min-h-[90px] flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none"
            />
            <button onClick={sendMessage} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">
              Enviar
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="text-sm font-semibold text-white">Asignación y embudo</h3>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wide text-zinc-500">Operador</label>
              <select
                value={assignedUserId}
                onChange={(e) => saveAssignment(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                <option value="">Sin asignar</option>
                {summary.operators.map((operator) => (
                  <option key={operator.user_id} value={operator.user_id}>
                    {operator.full_name || operator.email || operator.user_id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-wide text-zinc-500">Etapa</label>
              <select
                value={selectedStageId}
                onChange={(e) => saveStage(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                <option value="">Sin etapa</option>
                {summary.stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="text-sm font-semibold text-white">Etiquetas</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {summary.tags.map((tag) => {
              const active = detail.tags.some((item) => item.id === tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-zinc-700 text-zinc-400'}`}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex gap-2">
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              placeholder="Nueva etiqueta"
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
            <button onClick={createTag} className="rounded-xl border border-zinc-700 px-3 py-2 text-sm text-white">
              Crear
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="text-sm font-semibold text-white">Notas internas</h3>
          <div className="mt-3 space-y-3">
            {detail.notes.length === 0 ? <div className="text-sm text-zinc-500">Sin notas todavía.</div> : detail.notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-200">
                <div>{note.body}</div>
                <div className="mt-2 text-[11px] text-zinc-500">{new Date(note.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={3}
            placeholder="Agregar nota interna…"
            className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
          <button onClick={addNote} className="mt-2 rounded-xl border border-zinc-700 px-3 py-2 text-sm text-white">
            Guardar nota
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <h3 className="text-sm font-semibold text-white">Oportunidad comercial</h3>
          <div className="mt-4 space-y-3">
            <input
              value={opportunityTitle}
              onChange={(e) => setOpportunityTitle(e.target.value)}
              placeholder="Ej: Plan Pro anual"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
            <input
              value={opportunityAmount}
              onChange={(e) => setOpportunityAmount(e.target.value)}
              placeholder="Monto estimado"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            />
            {detail.opportunity ? (
              <div className="rounded-xl border border-emerald-800/60 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Oportunidad activa: <strong>{detail.opportunity.title}</strong>
                {detail.opportunity.amount != null ? ` · ${detail.opportunity.amount}` : ''}
              </div>
            ) : null}
            <button onClick={saveOpportunity} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
              Guardar oportunidad
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
