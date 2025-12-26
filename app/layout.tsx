import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ResumeMatch AI - Resume Analysis Tool',
  description: 'Analyze your resume against job descriptions with AI-powered matching',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
