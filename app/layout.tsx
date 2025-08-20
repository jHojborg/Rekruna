import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/shared/Header'
import { HashRecoveryRouter } from '@/components/shared/HashRecoveryRouter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rekruna',
  description: 'AI-drevet CV-screening',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="da" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Fanger Supabase password-recovery links uanset hvilken route brugeren rammer */}
        <HashRecoveryRouter />
        <Header />
        {children}
      </body>
    </html>
  )
}