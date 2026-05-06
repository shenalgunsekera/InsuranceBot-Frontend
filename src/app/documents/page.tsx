'use client'
import { useEffect, useState, useRef } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { listDocuments, uploadDocument, deleteDocument } from '@/lib/api'
import type { Document } from '@/types'
import { format } from 'date-fns'
import clsx from 'clsx'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400',
  processing: 'bg-blue-900/50 text-blue-400',
  ready: 'bg-green-900/50 text-green-400',
  error: 'bg-red-900/50 text-red-400',
}

const CATEGORIES = [
  { value: 'general', label: 'General Insurance' },
  { value: 'life-insurance', label: 'Life Insurance' },
  { value: 'health-insurance', label: 'Health Insurance' },
  { value: 'motor-insurance', label: 'Motor Insurance' },
  { value: 'sri-lanka-regulations', label: 'Sri Lanka Regulations' },
  { value: 'claims', label: 'Claims Procedures' },
  { value: 'products', label: 'Products & Pricing' },
  { value: 'company-policy', label: 'Company Policy' },
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    try { setDocs(await listDocuments()) } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000) // poll for status updates
    return () => clearInterval(interval)
  }, [])

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      await uploadDocument(file, category, description)
      setDescription('')
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This also removes it from the knowledge base.`)) return
    await deleteDocument(id)
    load()
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-white mb-6">Knowledge Base Documents</h1>

        {/* Upload Zone */}
        <div
          className={clsx(
            'border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors cursor-pointer',
            dragOver ? 'border-blue-500 bg-blue-900/10' : 'border-gray-700 hover:border-gray-600',
          )}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
          <div className="text-4xl mb-2">{uploading ? '⏳' : '📄'}</div>
          <p className="text-white font-semibold">{uploading ? 'Uploading & Processing...' : 'Drop a file here or click to browse'}</p>
          <p className="text-sm text-gray-400 mt-1">Supports PDF, DOCX, TXT, MD — max 50 MB</p>

          <div className="mt-4 flex items-center gap-3 justify-center flex-wrap" onClick={e => e.stopPropagation()}>
            <select value={category} onChange={e => setCategory(e.target.value)} className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 w-56"
            />
          </div>
        </div>

        {/* Document List */}
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-3">
            {docs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">No documents yet</p>
                <p className="text-sm">Upload PDF, DOCX, or TXT files to build the knowledge base</p>
              </div>
            )}
            {docs.map(doc => (
              <div key={doc.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-shrink-0 text-2xl">
                  {doc.file_type === 'pdf' ? '📕' : doc.file_type === 'docx' ? '📘' : '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{doc.original_filename}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full capitalize', STATUS_COLORS[doc.status])}>{doc.status}</span>
                    <span className="text-xs text-gray-400">{formatBytes(doc.file_size)}</span>
                    {doc.chunk_count > 0 && <span className="text-xs text-gray-400">{doc.chunk_count} chunks</span>}
                    <span className="text-xs text-gray-500 capitalize">{doc.category?.replace(/-/g, ' ')}</span>
                    <span className="text-xs text-gray-500">{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {doc.error_message && <p className="text-xs text-red-400 mt-1">{doc.error_message}</p>}
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.original_filename)}
                  className="flex-shrink-0 px-3 py-1.5 text-xs bg-red-900/30 hover:bg-red-900 text-red-400 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
