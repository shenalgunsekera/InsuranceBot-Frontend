const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...(options.headers as Record<string, string>),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }

  if (res.status === 204) return null as T
  return res.json()
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export async function login(username: string, password: string) {
  const form = new URLSearchParams({ username, password })
  const res = await fetch(`${BASE}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json() as Promise<{ access_token: string; username: string }>
}

// ─── Stats ─────────────────────────────────────────────────────────────────
export const getStats = () => request<import('@/types').Stats>('/admin/stats')
export const getModelStatus = () => request<import('@/types').ModelStatus>('/admin/model/status')

// ─── API Keys ──────────────────────────────────────────────────────────────
export const listKeys = () => request<import('@/types').APIKey[]>('/keys')
export const createKey = (body: {
  name: string
  description?: string
  owner_email?: string
  rate_limit: number
  company_name?: string
  bot_name?: string
  primary_color?: string
  secondary_color?: string
  welcome_message?: string
  logo_url?: string
}) => request<import('@/types').CreateKeyResponse>('/keys', { method: 'POST', body: JSON.stringify(body) })
export const toggleKey = (id: string) => request(`/keys/${id}/toggle`, { method: 'PATCH' })
export const deleteKey = (id: string) => request(`/keys/${id}`, { method: 'DELETE' })

// ─── Documents ─────────────────────────────────────────────────────────────
export const listDocuments = () => request<import('@/types').Document[]>('/documents')
export const deleteDocument = (id: string) => request(`/documents/${id}`, { method: 'DELETE' })
export async function uploadDocument(
  file: File,
  category: string,
  description: string,
) {
  const form = new FormData()
  form.append('file', file)
  form.append('category', category)
  form.append('description', description)
  return request<import('@/types').Document>('/documents', {
    method: 'POST',
    body: form,
  })
}

// ─── Logs ──────────────────────────────────────────────────────────────────
export const getLogs = (limit = 50, offset = 0) =>
  request<import('@/types').ChatLog[]>(`/admin/logs?limit=${limit}&offset=${offset}`)

// ─── Chat (admin test — uses internal API key or bearer) ───────────────────
export async function* streamChat(
  message: string,
  sessionId: string | null,
  apiKey: string,
): AsyncGenerator<{ type: string; [key: string]: unknown }> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ message, session_id: sessionId, stream: true }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed' }))
    throw new Error(err.detail)
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          yield JSON.parse(line.slice(6))
        } catch {
          // skip malformed
        }
      }
    }
  }
}
