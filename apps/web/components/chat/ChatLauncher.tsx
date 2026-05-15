'use client'

import dynamic from 'next/dynamic'
import {useState} from 'react'

const Chat = dynamic(() => import('./Chat'), {ssr: false})

export default function ChatLauncher() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-lg transition hover:scale-105 hover:bg-stone-700 md:bottom-6 md:right-6"
      >
        {open ? (
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6">
            <path
              fillRule="evenodd"
              d="M10 8.586 4.95 3.536 3.536 4.95 8.586 10l-5.05 5.05 1.414 1.414L10 11.414l5.05 5.05 1.414-1.414L11.414 10l5.05-5.05L15.05 3.536 10 8.586Z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M12 3C6.477 3 2 6.91 2 11.73c0 2.34 1.07 4.46 2.83 6.02L4 22l4.61-1.97c1.07.34 2.21.53 3.39.53 5.523 0 10-3.91 10-8.73S17.523 3 12 3Z" />
          </svg>
        )}
      </button>

      {open && <Chat onClose={() => setOpen(false)} />}
    </>
  )
}
