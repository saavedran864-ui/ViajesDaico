import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Viajes DaiCo',
  description: 'Tu segundo cerebro para viajeros',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
