import './styles.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Digital Sun SaaS Factory',
  description: 'Multiempresa, IA real, automatización y WhatsApp para vender servicios con agentes inteligentes.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
