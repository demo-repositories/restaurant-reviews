'use client'

import {useChat} from '@ai-sdk/react'
import {DefaultChatTransport, type UIMessage} from 'ai'
import {useEffect, useRef, useState} from 'react'
import ReactMarkdown from 'react-markdown'

function isWaitingForText(messages: UIMessage[]): boolean {
  const last = messages[messages.length - 1]
  if (!last || last.role !== 'assistant') return true
  const parts = last.parts ?? []
  if (parts.length === 0) return true
  const lastPart = parts[parts.length - 1]
  return !(lastPart.type === 'text' && lastPart.text.trim().length > 0)
}

export default function Chat({onClose}: {onClose: () => void}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // SSR-safe thread id, persisted for the lifetime of the chat panel.
  const [threadId] = useState(() =>
    typeof window !== 'undefined' ? crypto.randomUUID() : '',
  )

  const {messages, sendMessage, status, error, regenerate} = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: () => ({threadId}),
    }),
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'})
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    sendMessage({text})
    setInput('')
  }

  const isLoading = status === 'submitted' || status === 'streaming'
  const showLoader = isLoading && isWaitingForText(messages)

  return (
    <div className="fixed inset-x-2 bottom-2 z-[999] flex h-[80vh] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl md:inset-auto md:bottom-24 md:right-6 md:h-[600px] md:w-96">
      <header className="flex items-center justify-between border-b border-stone-200 bg-stone-900 px-4 py-3 text-white">
        <div>
          <h3 className="text-sm font-semibold">Restaurant concierge</h3>
          <p className="text-xs text-stone-400">Ask for recommendations</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-full p-1.5 text-stone-300 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path
              fillRule="evenodd"
              d="M10 8.586 4.95 3.536 3.536 4.95 8.586 10l-5.05 5.05 1.414 1.414L10 11.414l5.05 5.05 1.414-1.414L11.414 10l5.05-5.05L15.05 3.536 10 8.586Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-stone-500">
            <p className="font-medium text-stone-700">Hi — I&rsquo;m the Views concierge.</p>
            <p>
              Try: <em>&ldquo;Find a gluten-free Italian place with outdoor seating.&rdquo;</em>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {showLoader && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-stone-100 px-4 py-2 text-sm text-stone-600">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                <span>{error.message || 'Something went wrong.'}</span>
                <button
                  type="button"
                  onClick={() => regenerate()}
                  className="w-fit rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                >
                  Try again
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-stone-200 bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about restaurants…"
          disabled={isLoading}
          className="flex-1 rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-stone-500 focus:bg-white disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  )
}

function MessageBubble({message}: {message: UIMessage}) {
  const isUser = message.role === 'user'
  const text = (message.parts ?? [])
    .filter((p) => p.type === 'text')
    .map((p) => (p as {text: string}).text)
    .join('')

  if (!text.trim()) return null

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isUser ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
