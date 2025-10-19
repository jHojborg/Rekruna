import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'
import { HashRecoveryRouter } from '@/components/shared/HashRecoveryRouter'
import { Toaster } from 'react-hot-toast'

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
        {/* Google tag (gtag.js) - Loades på alle sider automatisk */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-31RMZC70DP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-31RMZC70DP');
          `}
        </Script>

        {/* Fanger Supabase password-recovery links uanset hvilken route brugeren rammer */}
        <HashRecoveryRouter />
        {/* Toast notifications - vises i top-right hjørne */}
        <Toaster
          position="top-right"
          toastOptions={{
            // Default options for all toasts
            duration: 5000,
            style: {
              background: '#fff',
              color: '#333',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              maxWidth: '500px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}