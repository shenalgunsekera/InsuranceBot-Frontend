'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { getStats, getModelStatus } from '@/lib/api'
import type { Stats, ModelStatus } from '@/types'
import clsx from 'clsx'

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-sm text-gray-400">{label}</p>
      <p className={clsx('text-3xl font-bold mt-1', color || 'text-white')}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [model, setModel] = useState<ModelStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getModelStatus()])
      .then(([s, m]) => { setStats(s); setModel(m) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Model Status Banner */}
            <div className={clsx(
              'mb-6 p-4 rounded-xl border flex items-center gap-3',
              model?.available
                ? 'bg-green-900/20 border-green-800 text-green-300'
                : 'bg-red-900/20 border-red-800 text-red-300',
            )}>
              <div className={clsx('w-3 h-3 rounded-full', model?.available ? 'bg-green-400' : 'bg-red-400')} />
              <div>
                <span className="font-semibold">
                  {model?.available ? 'LLM Online' : 'LLM Offline'}
                </span>
                <span className="text-sm ml-2 opacity-75">
                  Model: {model?.current_model || '—'}
                  {model?.installed_models?.length ? ` | Installed: ${model.installed_models.join(', ')}` : ''}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total API Keys" value={stats?.total_keys ?? 0} sub={`${stats?.active_keys ?? 0} active`} />
              <StatCard label="Total Chats" value={stats?.total_chats ?? 0} sub={`${stats?.chats_today ?? 0} today`} color="text-blue-400" />
              <StatCard label="Documents" value={stats?.total_documents ?? 0} sub={`${stats?.ready_documents ?? 0} ready`} color="text-purple-400" />
              <StatCard label="Knowledge Chunks" value={stats?.total_chunks ?? 0} sub="in vector DB" color="text-amber-400" />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { href: '/chat', title: 'Test the Chatbot', desc: 'Open the live chat interface to test responses', icon: '💬' },
                { href: '/documents', title: 'Upload Knowledge', desc: 'Add PDF, DOCX, or TXT files to the knowledge base', icon: '📄' },
                { href: '/api-keys', title: 'Manage API Keys', desc: 'Create and manage API keys for integrations', icon: '🔑' },
              ].map(item => (
                <a key={item.href} href={item.href} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-600 transition-colors group">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{item.desc}</p>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
