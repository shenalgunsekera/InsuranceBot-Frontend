'use client'
import { useState, useRef, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { streamChat } from '@/lib/api'
import type { ChatMessage } from '@/types'
import ReactMarkdown from 'react-markdown'
import clsx from 'clsx'

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user'
  return (
    <div className={clsx('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200',
      )}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={clsx(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
        isUser ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100',
      )}>
        {isUser ? (
          <p>{msg.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
              strong: ({ children }) => <strong className="font-semibold text-blue-300">{children}</strong>,
              h3: ({ children }) => <h3 className="font-bold text-white mb-1 mt-2">{children}</h3>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
        {msg.sources && msg.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400">Sources: {msg.sources.join(', ')}</p>
          </div>
        )}
        {msg.isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Hello! I am InsurBot, your insurance specialist assistant. Ask me anything about insurance — policies, claims, Sri Lankan regulations, or coverage options.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || !apiKey.trim() || sending) return
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    const aiMsgId = (Date.now() + 1).toString()
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages(prev => [...prev, userMsg, aiMsg])
    setInput('')
    setSending(true)

    try {
      for await (const chunk of streamChat(input.trim(), sessionId, apiKey)) {
        if (chunk.type === 'session') {
          setSessionId(chunk.session_id as string)
        } else if (chunk.type === 'token') {
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId
                ? { ...m, content: m.content + (chunk.content as string) }
                : m,
            ),
          )
        } else if (chunk.type === 'sources') {
          setMessages(prev =>
            prev.map(m =>
              m.id === aiMsgId ? { ...m, sources: chunk.sources as string[] } : m,
            ),
          )
        } else if (chunk.type === 'done') {
          setMessages(prev =>
            prev.map(m => (m.id === aiMsgId ? { ...m, isStreaming: false } : m)),
          )
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error contacting LLM'
      setMessages(prev =>
        prev.map(m =>
          m.id === aiMsgId
            ? { ...m, content: `Error: ${message}`, isStreaming: false }
            : m,
        ),
      )
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Test Chat</h1>
          {sessionId && (
            <span className="text-xs text-gray-500 font-mono">Session: {sessionId.slice(0, 8)}...</span>
          )}
        </div>

        {/* API Key Input */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Paste your API key (isk_...) to test"
            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => { setMessages([{ id: '0', role: 'assistant', content: 'Session cleared. How can I help?', timestamp: new Date() }]); setSessionId(null) }}
            className="px-3 py-2 text-xs bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 bg-gray-900 rounded-xl p-4 border border-gray-800 scrollbar-thin">
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="mt-4 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about insurance..."
            disabled={sending}
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim() || !apiKey.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
