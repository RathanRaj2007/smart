import type { Metadata } from 'next'
import './globals.css'
import './responsive.css'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { FallbackProvider } from '@/components/providers/FallbackProvider'

export const metadata: Metadata = {
  title: 'SmartInterview AI',
  description: 'Adaptive AI-powered interview platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Blocking script: runs before React hydration to apply stored theme,
            preventing a flash of the wrong theme on page load. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('smartinterview-theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light-theme');
                    document.body && document.body.classList.add('light-theme');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional" />
      </head>
      <body>
        <ToastProvider>
          <ThemeProvider>
            <FallbackProvider>
              {children}
            </FallbackProvider>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
