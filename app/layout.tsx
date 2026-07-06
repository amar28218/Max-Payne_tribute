import type { Metadata } from 'next'
import { Bebas_Neue, Special_Elite, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const bebasNeue = Bebas_Neue({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-sans'
})

const specialElite = Special_Elite({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-mono'
})

const playfairDisplay = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-serif'
})

export const metadata: Metadata = {
  title: 'MAX PAYNE | An Unofficial Fan Tribute',
  description: 'An unofficial, non-commercial fan tribute to Max Payne (2001) — rain, noir, and a very bad night in New York. Not affiliated with Remedy Entertainment or Rockstar Games.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${specialElite.variable} ${playfairDisplay.variable} bg-background`}>
      <body className="font-sans antialiased overflow-x-hidden">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
