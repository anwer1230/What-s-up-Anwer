export type SanitizeMode = 'salam' | 'skip' | 'smart' | 'always' | 'off';
export type SendType = 'manual' | 'scheduled';

export interface TelegramSettings {
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

export type WhatsAppSettings = TelegramSettings;

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

export interface AccountProxyConfig {
  enabled: boolean;
  type: 'socks5' | 'http' | 'https';
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface TelegramAccount {
  id: string;
  phone: string;
  session_name: string;
  session_string?: string;
  api_id?: number;
  api_hash?: string;
  username?: string;
  first_name?: string;
  status: 'connected' | 'disconnected' | 'connecting' | '2fa_needed' | 'flood_wait' | 'error';
  flood_wait_seconds?: number;
  has_2fa: boolean;
  proxy?: AccountProxyConfig;
  is_active: boolean;
  created_at: string;
  last_sync: string;
  stats: {
    sent: number;
    errors: number;
    received: number;
  };
}

export interface MultiAccountBroadcastResult {
  account_id: string;
  phone: string;
  session_name: string;
  status: 'success' | 'failed' | 'flood_wait';
  message: string;
  error?: string;
  wait_seconds?: number;
}

export interface ScrapedLinkTypeWrapper {
  id: string;
}


export type ScrapedLinkType = 'telegram' | 'whatsapp' | 'other';
export type LinkVerifyStatus = 'valid' | 'invalid' | 'checking' | 'unverified';

export interface ScrapedLinkItem {
  id: string;
  url: string;
  type: ScrapedLinkType;
  source_chat_id: string;
  source_title: string;
  source_type: 'group' | 'channel' | 'private' | 'unknown';
  sender_name?: string;
  timestamp: string;
  message_snippet?: string;
  status?: LinkVerifyStatus;
  notes?: string;
}

export type ScrapeTimeRange = '24_hours' | '7_days' | '10_days' | '30_days' | 'all' | 'custom';

export interface LinkScrapeProgressEvent {
  scanned_chats: number;
  total_chats: number;
  current_chat_title: string;
  found_total: number;
  found_tg: number;
  found_wa: number;
  found_other: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  new_link?: ScrapedLinkItem;
}

export interface LiveCapturedLinkItem {
  id: string;
  url: string;
  type: 'telegram' | 'whatsapp' | 'other';
  action_taken: 'joined_telegram' | 'saved_whatsapp' | 'saved_other' | 'failed';
  source_chat_id?: string;
  source_title: string;
  sender_name: string;
  timestamp: string;
  status_text: string;
  original_message?: string;
}

export interface LiveMonitorState {
  is_active: boolean;
  total_captured: number;
  joined_telegram_count: number;
  saved_whatsapp_count: number;
  captured_links: LiveCapturedLinkItem[];
}
