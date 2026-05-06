import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IS ChatBot — Admin Dashboard',
  description: 'Insurance Specialist AI Chatbot — Self-Hosted Admin Panel',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
