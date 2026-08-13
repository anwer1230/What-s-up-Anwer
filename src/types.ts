export type SanitizeMode = 'salam' | 'skip' | 'smart' | 'always' | 'off';
export type SendType = 'manual' | 'scheduled';

export interface WhatsAppSettings {
  message: string;
  groups: string[];
  watch_words: string[];
  interval_seconds: number;
  send_type: SendType;
  schedule_duration_hours: number;
  sanitize_mode: SanitizeMode;
  smart_required_messages: number;
  last_scheduled_send?: number;
  auto_reply_enabled?: boolean;
  auto_replies?: AutoReplyRule[];
  learning_active_private?: boolean;
  learning_active_group?: boolean;
  rotating_messages?: string[];
  rotating_groups?: string[];
  rotating_interval?: number;
}

export interface BatchEntry {
  group: string;
  msg_id: string;
  phone?: string;
  status?: string;
}

export interface SentBatch {
  id: string;
  text: string;
  has_media: boolean;
  sent_at: string;
  edited_at?: string;
  sent_count: number;
  group_count: number;
  entries: BatchEntry[];
  groups?: Array<{ title: string; username: string }>;
}

export interface AutoReplyRule {
  keyword: string;
  reply: string;
  scope: 'all' | 'private' | 'groups';
  match: 'contains' | 'exact' | 'regex';
  used_count?: number;
  last_used?: string;
}

export interface SavedLink {
  id: string;
  url: string;
  title: string;
  category: string;
  date_saved: string;
  source: string;
  notes?: string;
}

export interface AutoJoinItem {
  idx: number;
  total: number;
  url: string;
  status: 'processing' | 'success' | 'failed' | 'already';
  reason: string;
}

export interface AutoJoinProgressEvent {
  idx: number;
  total: number;
  url: string;
  status: 'processing' | 'success' | 'failed' | 'already';
  reason: string;
  counts: {
    success: number;
    fail: number;
    already: number;
    done: number;
    total: number;
  };
}

export interface LearningService {
  description: string;
  keywords: string[];
  price_range?: string;
  time_range?: string;
}

export interface UnknownRequest {
  text: string;
  sender: string;
  sender_id: string;
  time: string;
  chat_id: string;
}

export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number;
  std: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export interface ActivityLog {
  id: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface AcademicAnalysisResult {
  stats: Record<string, any>;
  histogram_bars?: Array<{ label: string; value: number; height: number }>;
  summary: string;
}

export interface LogUpdate {
  message: string;
  timestamp?: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}
