import type {Metadata} from 'next'
import './globals.css'
import ChatLauncher from '@/components/chat/ChatLauncher'

export const metadata: Metadata = {
  title: 'Views — Restaurants near you',
  description: 'Find restaurants near you, filter by cuisine, tags and features.',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <ChatLauncher />
      </body>
    </html>
  )
}
