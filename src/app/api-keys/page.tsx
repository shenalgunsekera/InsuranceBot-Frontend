'use client'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { listKeys, createKey, toggleKey, deleteKey } from '@/lib/api'
import type { APIKey, CreateKeyResponse } from '@/types'
import { COLOR_THEMES } from '@/types'
import { format } from 'date-fns'
import clsx from 'clsx'

const DEFAULT_FORM = {
  name: '',
  description: '',
  owner_email: '',
  rate_limit: 100,
  company_name: '',
  bot_name: 'InsurBot',
  primary_color: '#2563eb',
  secondary_color: '#1e40af',
  welcome_message: 'Hello! I\'m your insurance assistant. How can I help you today?',
  logo_url: '',
}

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx('w-8 h-8 rounded-lg border-2 transition-all', selected ? 'border-white scale-110' : 'border-transparent')}
      style={{ background: color }}
    />
  )
}

function BrandingPreview({ form }: { form: typeof DEFAULT_FORM }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 w-full max-w-xs">
      <div className="p-3 flex items-center gap-2" style={{ background: form.primary_color }}>
        {form.logo_url && <img src={form.logo_url} alt="" className="w-6 h-6 rounded object-cover" onError={e => (e.currentTarget.style.display = 'none')} />}
        <div>
          <p className="text-white text-sm font-bold">{form.bot_name || 'InsurBot'}</p>
          <p className="text-white/70 text-xs">{form.company_name || 'Your Company'}</p>
        </div>
      </div>
      <div className="bg-gray-900 p-3 space-y-2">
        <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 max-w-[85%]">
          {form.welcome_message || 'Hello! How can I help?'}
        </div>
        <div className="flex justify-end">
          <div className="rounded-lg px-3 py-2 text-xs text-white max-w-[85%]" style={{ background: form.primary_color }}>
            What is NCD?
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 max-w-[85%]">
          NCD (No-Claim Discount) rewards claim-free years...
        </div>
      </div>
      <div className="bg-gray-900 border-t border-gray-800 p-2 flex gap-2">
        <div className="flex-1 bg-gray-800 rounded-lg h-8" />
        <div className="w-16 h-8 rounded-lg text-xs text-white flex items-center justify-center" style={{ background: form.primary_color }}>
          Send
        </div>
      </div>
    </div>
  )
}

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newKey, setNewKey] = useState<CreateKeyResponse | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [tab, setTab] = useState<'basic' | 'brand'>('basic')

  async function load() {
    try { setKeys(await listKeys()) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function applyTheme(primary: string, secondary: string) {
    setForm(f => ({ ...f, primary_color: primary, secondary_color: secondary }))
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const result = await createKey({
      ...form,
      logo_url: form.logo_url || undefined,
      company_name: form.company_name || undefined,
    })
    setNewKey(result)
    setForm(DEFAULT_FORM)
    setShowCreate(false)
    load()
  }

  const f = (k: keyof typeof DEFAULT_FORM, v: string | number) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <button onClick={() => { setShowCreate(true); setTab('basic') }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
            + New Key
          </button>
        </div>

        {/* Revealed key */}
        {newKey && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-xl">
            <p className="text-green-300 font-semibold mb-2">Key created — copy it now, it won&apos;t be shown again</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 text-green-400 px-3 py-2 rounded-lg text-sm font-mono break-all">{newKey.raw_key}</code>
              <button onClick={() => navigator.clipboard.writeText(newKey.raw_key)} className="px-3 py-2 bg-gray-700 text-white text-xs rounded-lg">Copy</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Embed snippet: <code className="text-blue-400">{'<script src="YOUR_SITE/widget/chat-widget.js" data-api-key="' + newKey.raw_key + '"></script>'}</code>
            </p>
            <button onClick={() => setNewKey(null)} className="mt-2 text-xs text-gray-400 underline">Dismiss</button>
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-bold text-white mb-4">Create API Key</h2>

                {/* Tabs */}
                <div className="flex gap-1 mb-5 bg-gray-800 rounded-lg p-1">
                  {(['basic', 'brand'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)} className={clsx('flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors', tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white')}>
                      {t === 'basic' ? 'Basic Settings' : 'Branding & Theme'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleCreate}>
                  {tab === 'basic' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Key Name *</label>
                        <input required value={form.name} onChange={e => f('name', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" placeholder="e.g. Ceylinco Insurance Website" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                        <input value={form.description} onChange={e => f('description', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" placeholder="Optional" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Owner Email</label>
                        <input type="email" value={form.owner_email} onChange={e => f('owner_email', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" placeholder="client@company.com" />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Rate Limit (requests/hour)</label>
                        <input type="number" value={form.rate_limit} onChange={e => f('rate_limit', Number(e.target.value))} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" min={1} max={10000} />
                      </div>
                    </div>
                  )}

                  {tab === 'brand' && (
                    <div className="flex gap-5">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Company Name</label>
                          <input value={form.company_name} onChange={e => f('company_name', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" placeholder="Ceylinco Insurance" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Bot Name</label>
                          <input value={form.bot_name} onChange={e => f('bot_name', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" placeholder="InsurBot" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Welcome Message</label>
                          <textarea value={form.welcome_message} onChange={e => f('welcome_message', e.target.value)} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none" />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Logo URL (optional)</label>
                          <input value={form.logo_url} onChange={e => f('logo_url', e.target.value)} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm" placeholder="https://..." />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Color Theme</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {COLOR_THEMES.map(t => (
                              <button key={t.name} type="button" title={t.name} onClick={() => applyTheme(t.primary, t.secondary)}
                                className={clsx('w-8 h-8 rounded-lg border-2 transition-all', form.primary_color === t.primary ? 'border-white scale-110' : 'border-transparent')}
                                style={{ background: t.primary }} />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Custom Primary</label>
                              <div className="flex gap-2 items-center">
                                <input type="color" value={form.primary_color} onChange={e => f('primary_color', e.target.value)} className="w-10 h-8 rounded cursor-pointer bg-transparent border-0" />
                                <input value={form.primary_color} onChange={e => f('primary_color', e.target.value)} className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs font-mono" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Custom Secondary</label>
                              <div className="flex gap-2 items-center">
                                <input type="color" value={form.secondary_color} onChange={e => f('secondary_color', e.target.value)} className="w-10 h-8 rounded cursor-pointer bg-transparent border-0" />
                                <input value={form.secondary_color} onChange={e => f('secondary_color', e.target.value)} className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-xs font-mono" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Live preview */}
                      <div className="w-56 flex-shrink-0">
                        <p className="text-xs text-gray-400 mb-2">Live Preview</p>
                        <BrandingPreview form={form} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-5 pt-4 border-t border-gray-800">
                    {tab === 'basic' && <button type="button" onClick={() => setTab('brand')} className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg">Next: Branding →</button>}
                    {tab === 'brand' && <button type="button" onClick={() => setTab('basic')} className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg">← Back</button>}
                    <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">Create Key</button>
                    <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-800 text-gray-400 text-sm rounded-lg">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Key list */}
        {loading ? <p className="text-gray-400">Loading...</p> : (
          <div className="space-y-3">
            {keys.length === 0 && <p className="text-gray-500 text-center py-8">No API keys yet. Create one above.</p>}
            {keys.map(key => (
              <div key={key.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                {/* Color indicator */}
                <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ background: key.primary_color }}>
                  {(key.company_name || key.name).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-white text-sm">{key.company_name || key.name}</span>
                    {key.bot_name && key.bot_name !== 'InsurBot' && <span className="text-xs text-gray-400">· {key.bot_name}</span>}
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full', key.is_active ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400')}>
                      {key.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <code className="bg-gray-800 px-2 py-0.5 rounded font-mono">{key.key_prefix}...</code>
                    <span>{key.total_requests} requests</span>
                    <span>{key.rate_limit}/hr</span>
                    {key.owner_email && <span>{key.owner_email}</span>}
                    <span>{format(new Date(key.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleKey(key.id).then(load)} className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg">
                    {key.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => { if (confirm('Delete this key?')) deleteKey(key.id).then(load) }} className="px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900 text-red-400 rounded-lg">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
