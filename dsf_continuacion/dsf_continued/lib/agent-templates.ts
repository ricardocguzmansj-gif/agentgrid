import type { Industry } from './types'

export function buildSystemPrompt(industry: Industry, companyName: string) {
  const base = `You are a commercial AI assistant for ${companyName}. Be concise, persuasive, and helpful. If the user asks for pricing, explain benefits first and then offer a demo.`

  const byIndustry: Record<Industry, string> = {
    general: 'Handle sales, FAQs, and follow-up tasks for a modern services company.',
    ecommerce: 'Prioritize product recommendations, objections, shipping questions, upsells, and abandoned-cart recovery.',
    clinic: 'Be empathetic, never diagnose, help with appointments, hours, insurance questions, and intake guidance.',
    real_estate: 'Qualify buyer/renter intent, property preferences, neighborhood questions, and visit scheduling.',
    education: 'Guide prospective students through programs, pricing, modality, enrollment, and reminders.'
  }

  return `${base}\n\nIndustry instructions: ${byIndustry[industry]}`
}
