'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getLogs } from '@/lib/api'
import type { ChatLog } from '@/types'
import { format } from 'date-fns'

export default function LogsPage() {
  const [logs, setLogs] = useState<ChatLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const limit = 20

  async function load() {
    setLoading(true)
    try { setLogs(await getLogs(limit, page * limit)) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page])

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Chat Logs</h1>
          <button onClick={load} className="text-sm text-blue-400 hover:text-blue-300">Refresh</button>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <>
            <div className="space-y-2">
              {logs.length === 0 && <p className="text-gray-500 text-center py-8">No chat logs yet.</p>}
              {logs.map(log => (
                <div
                  key={log.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                >
                  <button
                    className="w-full text-left p-4 hover:bg-gray-800/50 transition-colors"
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{log.user_message}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 font-mono">{log.session_id.slice(0, 8)}...</span>
                          {log.api_key_prefix && (
                            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded font-mono">{log.api_key_prefix}...</span>
                          )}
                          {log.model_used && <span className="text-xs text-purple-400">{log.model_used}</span>}
                          {log.response_time_ms && <span className="text-xs text-gray-500">{log.response_time_ms}ms</span>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {format(new Date(log.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  </button>

                  {expanded === log.id && (
                    <div className="px-4 pb-4 border-t border-gray-800 pt-3 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-blue-400 mb-1">User</p>
                        <p className="text-sm text-gray-200 bg-gray-800 rounded-lg p-3">{log.user_message}</p>
                      </div>
                      {log.assistant_message && (
                        <div>
                          <p className="text-xs font-semibold text-green-400 mb-1">Assistant</p>
                          <p className="text-sm text-gray-200 bg-gray-800 rounded-lg p-3 whitespace-pre-wrap">{log.assistant_message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">Page {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={logs.length < limit}
                className="px-4 py-2 text-sm bg-gray-800 text-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
