import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '../components/theme-provider'
import MobileNav from '../components/MobileNav'
import MobileLayoutWrapper from '../components/MobileLayoutWrapper'

export const metadata: Metadata = {
  title: 'GPS Tracker Dashboard',
  description: 'Real-time GPS tracking dashboard with device monitoring and telemetry',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GPS Tracker',
  },
  icons: [
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/icon-192.png' },
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://gps-tracker.example.com',
    title: 'GPS Tracker Dashboard',
    description: 'Real-time GPS tracking dashboard',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GPS Tracker" />
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('✓ Service Worker registered:', registration);
                    },
                    function(err) {
                      console.log('✗ Service Worker registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
          <MobileLayoutWrapper>
            <MobileNav />
            {children}
          </MobileLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
