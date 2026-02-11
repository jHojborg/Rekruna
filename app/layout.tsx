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
  // Meta Pixel ID: fra env, eller fallback hvis ikke sat (fx på Vercel). Tom = pixel slået fra.
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '937295408872749'

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

        {/* Meta Pixel Code - Loades på alle sider automatisk (samme sted som Google Analytics) */}
        {metaPixelId && (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${metaPixelId}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

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