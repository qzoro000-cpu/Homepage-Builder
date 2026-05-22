import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Tatoa CMS - 관리자 대시보드',
  description: '다지점 미용 클리닉 콘텐츠 관리 시스템',
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
    <html lang="ko" className="bg-background">
      <head>
        {/* Sandoll 명조Neo1 — LP 제목/소제목용 웹폰트 */}
        <link rel="preconnect" href="https://o6cdhdutve.execute-api.ap-northeast-2.amazonaws.com" />
        <link
          rel="stylesheet"
          href="https://o6cdhdutve.execute-api.ap-northeast-2.amazonaws.com/v1/api/css/drop_fontstream_css/?sid=gAAAAABp34rUSf_DW-bOsbbyudIswhf0pMIf-cFaW8SIJzeKEQ1r1CRw0uMKkq3-EvAsf5nmj0sJVtuW3IRpLV6VMfrsBg3lR_lf5anamYrL2kCVpAhgGsQavSb6gWKjDnYi6f5k9ek3azyTedq11YV4p4TeAWHWIWVsssl9ZvR2wfQ-8_s73u5SrqkbtxZxXYqdKNhIPFvit6u9UZVIm8M5PPSs93GpZPyGCAHfyTEPKEDtLc3miZKBPaJOErxAjxDJXj7u9rpd"
          charSet="utf-8"
          referrerPolicy="origin"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
