import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { HashRecoveryRouter } from '@/components/shared/HashRecoveryRouter'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rekruna - AI-drevet CV-screening',
  description: 'Screen job-kandidater 80% hurtigere med vores AI-løsning',
  // Viser vores logo som favicon i browser fanen. Beholder .ico som fallback.
  icons: {
    icon: [
      { url: '/images/Logo_01.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/images/Logo_01.png',
    apple: '/images/Logo_01.png',
  },
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
        <Footer />
      </body>
    </html>
  )
}