export interface APIKey {
  id: string
  name: string
  description?: string
  key_prefix: string
  owner_email?: string
  is_active: boolean
  rate_limit: number
  total_requests: number
  created_at: string
  last_used_at?: string
  expires_at?: string
  company_name?: string
  bot_name: string
  primary_color: string
  secondary_color: string
  welcome_message: string
  logo_url?: string
}

export interface CreateKeyResponse extends APIKey {
  raw_key: string
}

export interface Document {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  status: 'pending' | 'processing' | 'ready' | 'error'
  chunk_count: number
  category?: string
  description?: string
  created_at: string
  processed_at?: string
  error_message?: string
}

export interface ChatLog {
  id: string
  api_key_prefix?: string
  session_id: string
  user_message: string
  assistant_message?: string
  model_used?: string
  response_time_ms?: number
  tokens_estimated?: number
  created_at: string
}

export interface Stats {
  total_keys: number
  active_keys: number
  total_chats: number
  chats_today: number
  total_documents: number
  ready_documents: number
  total_chunks: number
  model_available: boolean
  current_model: string
}

export interface ModelStatus {
  available: boolean
  current_model: string
  installed_models: string[]
  provider: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
  timestamp: Date
  isStreaming?: boolean
}

export const COLOR_THEMES = [
  { name: 'Ocean Blue',   primary: '#2563eb', secondary: '#1e40af' },
  { name: 'Forest Green', primary: '#16a34a', secondary: '#15803d' },
  { name: 'Royal Purple', primary: '#7c3aed', secondary: '#6d28d9' },
  { name: 'Sunset Orange',primary: '#ea580c', secondary: '#c2410c' },
  { name: 'Ruby Red',     primary: '#dc2626', secondary: '#b91c1c' },
  { name: 'Teal',         primary: '#0d9488', secondary: '#0f766e' },
  { name: 'Slate Dark',   primary: '#475569', secondary: '#1e293b' },
  { name: 'Gold',         primary: '#d97706', secondary: '#92400e' },
]
