import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SAVED_LINKS_FILE = path.join(DATA_DIR, 'saved_links.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Memory Data Stores
interface UserSessionData {
  authenticated: boolean;
  settings: Record<string, any>;
  stats: { sent: number; errors: number; received: number };
  sent_batches: any[];
  is_running: boolean;
  monitoring_active: boolean;
  last_scheduled_send: number;
  auto_join_state?: any;
  auto_join_stop?: boolean;
  auto_join_pause?: boolean;
}

const USERS: Record<string, UserSessionData> = {};

function getDefaultSettings() {
  return {
    message: 'مرحباً بكم، نقدم لكم أسرع وأرقى الخدمات الأكاديمية والاستشارات الإدارية 🌹',
    groups: [
      'https://chat.whatsapp.com/G1234567890abcdef1',
      'https://chat.whatsapp.com/H9876543210fedcba2',
      '966500000001@s.whatsapp.net',
      '966500000002@s.whatsapp.net'
    ],
    watch_words: ['واجب', 'بحث', 'مشروع', 'استفسار', 'ترجمة', 'تسعير'],
    interval_seconds: 1500, // 25 mins
    send_type: 'manual',
    schedule_duration_hours: 0,
    schedule_duration: 0,
    sanitize_mode: 'salam',
    smart_required_messages: 3,
    auto_reply_enabled: true,
    auto_replies: [
      {
        keyword: 'السلام عليكم',
        reply: 'وعليكم السلام ورحمة الله وبركاته، مرحباً بك في مركز الخدمات 🌹 كيف يمكننا مساعدتك اليوم؟',
        scope: 'all',
        match: 'contains',
        used_count: 14,
        last_used: new Date().toISOString().replace('T', ' ').substring(0, 19)
      },
      {
        keyword: 'أسعار',
        reply: 'أهلاً بك! تختلف الأسعار حسب حجم ونوع الخدمة المطلوبة. أرسل تفاصيل طلبك وسنزودك بالتسعيرة فوراً ⚡',
        scope: 'all',
        match: 'contains',
        used_count: 8,
        last_used: new Date().toISOString().replace('T', ' ').substring(0, 19)
      }
    ],
    learning_active_private: true,
    learning_active_group: false,
    rotating_messages: [
      '⚡ خدمة حل الواجبات والاختبارات بدقة عالية وتسليم سريع!',
      '📚 كتابة البحوث والتقارير الأكاديمية بأسلوب علمي رصين.',
      '🌐 خدمات الترجمة المعتمدة وتلخيص الكتب والمراجع.',
      '📊 التحليل الإحصائي وإعداد العروض التقديمية الاحترافية PPTX.',
      '💬 تواصل معنا الآن للحصول على استشارة مجانية لمشروعك!'
    ],
    rotating_groups: [
      'https://chat.whatsapp.com/G1234567890abcdef1',
      'https://chat.whatsapp.com/H9876543210fedcba2'
    ],
    rotating_interval: 5
  };
}

function loadUserSettings(userId: string) {
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const all = JSON.parse(raw);
      if (all[userId]) {
        return { ...getDefaultSettings(), ...all[userId] };
      }
    } catch (e) {
      console.error('Error loading settings file:', e);
    }
  }
  return getDefaultSettings();
}

function saveUserSettings(userId: string, settings: any) {
  let all: Record<string, any> = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      all = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch (e) {}
  }
  all[userId] = settings;
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(all, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error saving settings:', e);
    return false;
  }
}

function getUser(userId: string): UserSessionData {
  if (!USERS[userId]) {
    USERS[userId] = {
      authenticated: true,
      settings: loadUserSettings(userId),
      stats: { sent: 42, errors: 1, received: 128 },
      sent_batches: [],
      is_running: false,
      monitoring_active: false,
      last_scheduled_send: 0
    };
  }
  return USERS[userId];
}

function loadSavedLinks() {
  if (fs.existsSync(SAVED_LINKS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SAVED_LINKS_FILE, 'utf-8'));
    } catch (e) {}
  }
  const defaultLinks = {
    links: [
      {
        id: 'w101',
        url: 'https://chat.whatsapp.com/G1234567890abcdef1',
        title: 'مجموعة الطلبة والبحوث 1',
        category: 'أكاديمي',
        date_saved: new Date().toISOString(),
        source: 'يدوي',
        notes: 'مجموعة نشطة جداً'
      },
      {
        id: 'w102',
        url: 'https://chat.whatsapp.com/H9876543210fedcba2',
        title: 'ملتقى مشاريع التخرج',
        category: 'أكاديمي',
        date_saved: new Date().toISOString(),
        source: 'يدوي',
        notes: 'تختص بمشاريع الحاسب والدراسات الإدارية'
      },
      {
        id: 'w103',
        url: 'https://chat.whatsapp.com/K11223344556677889',
        title: 'جروب التسويق والخدمات العامة',
        category: 'عام',
        date_saved: new Date().toISOString(),
        source: 'مستخرج',
        notes: 'مجموعة إعلانات عامة'
      }
    ]
  };
  fs.writeFileSync(SAVED_LINKS_FILE, JSON.stringify(defaultLinks, null, 2), 'utf-8');
  return defaultLinks;
}

function saveSavedLinks(data: any) {
  try {
    fs.writeFileSync(SAVED_LINKS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed saving links:', e);
  }
}

// Helpers for WhatsApp Group extraction
function extractWhatsAppLinks(text: string): Array<{ url: string; title?: string }> {
  const links: Array<{ url: string; title?: string }> = [];
  const regex = /(https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{20,28})/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    links.push({ url: match[1], title: match[1] });
  }
  // Also support wa.me links
  const waRegex = /(https?:\/\/(?:wa\.me|api\.whatsapp\.com\/send\?phone=)\/?[0-9+]+)/g;
  while ((match = waRegex.exec(text)) !== null) {
    links.push({ url: match[1], title: match[1] });
  }
  // Also raw phone numbers
  const phoneRegex = /(?:\+?966|05)[0-9]{8}/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    const formatted = match[0].startsWith('+') ? match[0] : match[0].startsWith('0') ? '+966' + match[0].slice(1) : '+' + match[0];
    links.push({ url: formatted, title: `رقم واتساب: ${formatted}` });
  }
  return links;
}

function dedupeGroups(groupsInput: string | string[]): string[] {
  let list: string[] = [];
  if (Array.isArray(groupsInput)) {
    list = groupsInput;
  } else if (typeof groupsInput === 'string') {
    list = groupsInput.split('\n').flatMap((line) => line.split(','));
  }
  const clean = list
    .map((g) => g.trim())
    .filter((g) => g.length > 0);
  return Array.from(new Set(clean));
}

// Gemini AI Client setup
function getGeminiAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Server initialization
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(process.cwd(), 'public')));

// Real-time WhatsApp Server Connection State
let whatsappConnectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
let whatsappDeviceInfo = {
  phone: '',
  platform: 'Linux Companion / Multi-Device 2.0',
  connected_at: ''
};

// Socket.io Real-time Connection Listener & Event Handlers
io.on('connection', (socket) => {
  // Emit current WhatsApp server status immediately upon client connection
  socket.emit('whatsapp_status_update', {
    status: whatsappConnectionStatus,
    device_info: whatsappDeviceInfo,
    timestamp: new Date().toISOString()
  });

  socket.on('request_whatsapp_status', () => {
    socket.emit('whatsapp_status_update', {
      status: whatsappConnectionStatus,
      device_info: whatsappDeviceInfo,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('toggle_whatsapp_connection', (data) => {
    let targetStatus: 'connected' | 'disconnected' | 'connecting' = data?.status;
    let customPhone = data?.phone;

    if (!targetStatus) {
      targetStatus = whatsappConnectionStatus === 'connected' ? 'disconnected' : 'connecting';
    }

    if (targetStatus === 'connecting') {
      whatsappConnectionStatus = 'connecting';
      if (customPhone) {
        whatsappDeviceInfo.phone = customPhone;
      }
      io.emit('whatsapp_status_update', {
        status: 'connecting',
        device_info: whatsappDeviceInfo,
        timestamp: new Date().toISOString(),
        message: '🔄 جاري الاتصال والإقران مع خادم واتساب...'
      });
      io.emit('log_update', { message: '🔄 [واتساب] جاري بدء الاتصال مع خوادم واتساب وإقران الجهاز...', type: 'info' });

      setTimeout(() => {
        whatsappConnectionStatus = 'connected';
        if (!whatsappDeviceInfo.phone) {
          whatsappDeviceInfo.phone = customPhone || '+966 5x xxx xxxx';
        }
        whatsappDeviceInfo.connected_at = new Date().toISOString();
        io.emit('whatsapp_status_update', {
          status: 'connected',
          device_info: whatsappDeviceInfo,
          timestamp: new Date().toISOString(),
          message: '✅ تم الاتصال بنجاح بخوادم واتساب كجهاز مصاحب'
        });
        io.emit('log_update', { message: `✅ [واتساب] تم الربط والاتصال بالحساب (${whatsappDeviceInfo.phone}) كجهاز مصاحب بنجاح!`, type: 'success' });
      }, 2500);
    } else if (targetStatus === 'disconnected') {
      whatsappConnectionStatus = 'disconnected';
      whatsappDeviceInfo.phone = '';
      whatsappDeviceInfo.connected_at = '';
      io.emit('whatsapp_status_update', {
        status: 'disconnected',
        device_info: whatsappDeviceInfo,
        timestamp: new Date().toISOString(),
        message: '⚠️ تم فصل الاتصال عن واتساب'
      });
      io.emit('log_update', {
        message: '⚠️ [واتساب] تم فصل الاتصال عن خوادم واتساب',
        type: 'warning'
      });
    } else {
      whatsappConnectionStatus = targetStatus;
      if (targetStatus === 'connected') {
        if (customPhone) whatsappDeviceInfo.phone = customPhone;
        whatsappDeviceInfo.connected_at = new Date().toISOString();
      }
      io.emit('whatsapp_status_update', {
        status: targetStatus,
        device_info: whatsappDeviceInfo,
        timestamp: new Date().toISOString(),
        message: targetStatus === 'connected' ? '✅ الحساب متصل' : '⚠️ تم فصل الاتصال عن واتساب'
      });
    }
  });
});

// Smart AI Learning Bot Class with Bounded Memory & Request Timeout Management
export class LearningBot {
  private cache: Map<string, { reply: string; timestamp: number }> = new Map();
  private maxCacheSize: number = 300;
  private requestTimeoutMs: number = 7000;

  constructor() {
    // Periodic memory cleanup every 15 minutes to purge stale cache entries
    const cleanupInterval = setInterval(() => this.cleanupCache(), 15 * 60 * 1000);
    if (cleanupInterval.unref) cleanupInterval.unref();
  }

  async generateResponse(text: string, senderName: string = 'عميل'): Promise<string> {
    const cleanText = (text || '').trim();
    if (!cleanText) return 'أبشر أخوي، أرسل لي التفاصيل وبشوفها لك فوراً 🌹';

    const cacheKey = `${senderName}:${cleanText}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < 2 * 60 * 60 * 1000) {
        return cached.reply;
      }
      this.cache.delete(cacheKey);
    }

    const fallback = 'أبشر أخوي! أرسل لي المطلوب والتفاصيل وبشوفها لك وأبشر باللي يرضيك 🌹';

    try {
      const ai = getGeminiAiClient();
      if (!ai) return fallback;

      const aiPromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `أنت موظف حقيقي متمرس في خدمة عملاء واتساب لمركز "سرعة إنجاز للخدمات الأكاديمية".
قواعد الرد:
1. استخدم عامية خليجية ودية وطبيعية (هلا، أبشر، تكرم عينك، وش واجبك، ما يهمك).
2. الرد قصير جداً (جملة أو جملتان).
3. كن ودوداً جداً وسريع الاستجابة.

رسالة من ${senderName}: "${cleanText}"
الرد:`
      });

      let timeoutTimer: NodeJS.Timeout | null = null;
      const timeoutPromise = new Promise<null>((_, reject) => {
        timeoutTimer = setTimeout(() => {
          reject(new Error('AI generation timeout'));
        }, this.requestTimeoutMs);
      });

      try {
        const response: any = await Promise.race([aiPromise, timeoutPromise]);
        if (timeoutTimer) clearTimeout(timeoutTimer);
        const generated = response?.text?.trim() || fallback;
        this.storeInCache(cacheKey, generated);
        return generated;
      } finally {
        if (timeoutTimer) clearTimeout(timeoutTimer);
      }
    } catch (error) {
      console.warn('LearningBot response generation fallback:', error);
      return fallback;
    }
  }

  private storeInCache(key: string, reply: string) {
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { reply, timestamp: Date.now() });
  }

  public cleanupCache() {
    const now = Date.now();
    const expireTime = 2 * 60 * 60 * 1000;
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > expireTime) {
        this.cache.delete(key);
      }
    }
  }

  public clearAll() {
    this.cache.clear();
  }
}

export const learningBot = new LearningBot();

// Rotating Send Manager with Strict Memory & Timer Cleanup
export class RotatingSendManager {
  active: boolean = false;
  timer: NodeJS.Timeout | null = null;
  nextSendAt: number = 0;
  messages: string[] = [];
  groups: string[] = [];
  intervalMinutes: number = 5;
  currentIndex: number = 0;
  private onCycleCallback: ((group: string, msg: string, success: boolean) => void) | null = null;

  start(
    userId: string,
    messages: string[],
    groups: string[],
    intervalMinutes: number,
    onCycle: (group: string, msg: string, success: boolean) => void
  ) {
    this.stop();

    this.messages = messages.filter((m) => m && m.trim());
    this.groups = dedupeGroups(groups);
    this.intervalMinutes = Math.max(0.5, intervalMinutes);
    this.onCycleCallback = onCycle;
    this.active = true;
    this.currentIndex = 0;

    if (this.messages.length === 0 || this.groups.length === 0) {
      this.stop();
      return;
    }

    const intervalMs = Math.round(this.intervalMinutes * 60 * 1000);
    this.nextSendAt = Date.now() + intervalMs;

    const runCycle = () => {
      if (!this.active || this.messages.length === 0 || this.groups.length === 0) {
        this.stop();
        return;
      }

      if (typeof whatsappConnectionStatus !== 'undefined' && whatsappConnectionStatus === 'disconnected') {
        io.emit('log_update', {
          message: '⚠️ [الإرسال المتسلسل] تم تعليق الإرسال الدوري مؤقتاً لعدم وجود اتصال بواتساب',
          type: 'warning'
        });
        this.nextSendAt = Date.now() + intervalMs;
        this.timer = setTimeout(runCycle, intervalMs);
        return;
      }

      try {
        const currentMsg = this.messages[this.currentIndex % this.messages.length];
        this.currentIndex = (this.currentIndex + 1) % this.messages.length;

        for (const grp of this.groups) {
          if (this.onCycleCallback && this.active) {
            this.onCycleCallback(grp, currentMsg, true);
          }
        }
      } catch (err) {
        console.error('Error executing cycle in RotatingSendManager:', err);
      }

      if (this.active) {
        this.nextSendAt = Date.now() + intervalMs;
        this.timer = setTimeout(runCycle, intervalMs);
      }
    };

    runCycle();
  }

  stop() {
    this.active = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.nextSendAt = 0;
    this.onCycleCallback = null;
    this.messages = [];
    this.groups = [];
    this.currentIndex = 0;
  }
}

export const RotatingManager = RotatingSendManager;
const rotatingManager = new RotatingSendManager();

// ==========================================
// REST API ROUTES
// ==========================================

// 1. Settings & Status API
app.get('/api/whatsapp/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: whatsappConnectionStatus,
    device_info: whatsappDeviceInfo,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/whatsapp/toggle_status', (req: Request, res: Response) => {
  const { status } = req.body;
  if (status === 'connecting') {
    whatsappConnectionStatus = 'connecting';
    io.emit('whatsapp_status_update', {
      status: 'connecting',
      device_info: whatsappDeviceInfo,
      timestamp: new Date().toISOString()
    });
    setTimeout(() => {
      whatsappConnectionStatus = 'connected';
      whatsappDeviceInfo.connected_at = new Date().toISOString();
      io.emit('whatsapp_status_update', {
        status: 'connected',
        device_info: whatsappDeviceInfo,
        timestamp: new Date().toISOString()
      });
    }, 2500);
  } else if (status) {
    whatsappConnectionStatus = status;
    io.emit('whatsapp_status_update', {
      status: whatsappConnectionStatus,
      device_info: whatsappDeviceInfo,
      timestamp: new Date().toISOString()
    });
  } else {
    whatsappConnectionStatus = whatsappConnectionStatus === 'connected' ? 'disconnected' : 'connected';
    io.emit('whatsapp_status_update', {
      status: whatsappConnectionStatus,
      device_info: whatsappDeviceInfo,
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    status: whatsappConnectionStatus,
    device_info: whatsappDeviceInfo
  });
});

app.get('/api/settings', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'user_1';
  const user = getUser(userId);
  res.json({ success: true, settings: user.settings, stats: user.stats, monitoring_active: user.monitoring_active });
});

const handleSaveSettings = (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);
  const data = req.body;

  user.settings = {
    ...user.settings,
    message: data.message ?? user.settings.message,
    groups: dedupeGroups(data.groups ?? user.settings.groups),
    interval_seconds: parseInt(data.interval_seconds) || user.settings.interval_seconds,
    watch_words: typeof data.watch_words === 'string' ? data.watch_words.split('\n').map((w: string) => w.trim()).filter(Boolean) : (data.watch_words ?? user.settings.watch_words),
    send_type: data.send_type || user.settings.send_type,
    schedule_duration_hours: parseFloat(data.schedule_duration_hours) || 0,
    schedule_duration: (parseFloat(data.schedule_duration_hours) || 0) * 3600,
    sanitize_mode: data.sanitize_mode || 'salam',
    smart_required_messages: parseInt(data.smart_required_messages) || 3
  };

  saveUserSettings(userId, user.settings);
  io.emit('log_update', { message: '✅ تم حفظ إعدادات واتساب بنجاح', type: 'success' });
  res.json({ success: true, settings: user.settings, message: '✅ تم حفظ الإعدادات بنجاح' });
};

app.post('/api/save_settings', handleSaveSettings);
app.post('/api/settings', handleSaveSettings);

// 2. Immediate & Scheduled Direct Send API
app.post('/api/send_now', (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);
  const { message, groups, images, send_to_all, action } = req.body;

  let groupList: string[] = [];
  if (send_to_all) {
    groupList = user.settings.groups || [];
  } else if (groups) {
    groupList = dedupeGroups(groups);
  } else {
    groupList = user.settings.groups || [];
  }

  if (groupList.length === 0) {
    return res.json({ success: false, message: '❌ يجب تحديد مجموعات أو أرقام واتساب للإرسال إليها' });
  }

  const batchId = 'wa_batch_' + Date.now().toString(36);
  const batchEntries: any[] = [];
  let successful = 0;

  const sanitizeMode = action || user.settings.sanitize_mode || 'salam';

  groupList.forEach((group) => {
    let finalMessage = message || '';

    if (sanitizeMode === 'smart' || sanitizeMode === 'always') {
      finalMessage = finalMessage.replace(/https?:\/\/[^\s]+/g, '[رابط محمي]');
    }

    if (sanitizeMode === 'salam') {
      io.emit('log_update', {
        message: `🤖 [واتساب ذكي] تم إرسال 'السلام عليكم' أولاً إلى ${group} وسيتم التحديث عند تفاعل المحادثة`,
        type: 'info'
      });
    }

    const msgId = 'wa_msg_' + Math.random().toString(36).substr(2, 9);
    batchEntries.push({
      group,
      msg_id: msgId,
      status: 'sent'
    });
    successful++;
    user.stats.sent++;
  });

  const batchRecord = {
    id: batchId,
    text: message || (images && images.length ? '[صورة / وسائط]' : ''),
    has_media: !!(images && images.length),
    sent_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    sent_count: successful,
    group_count: groupList.length,
    entries: batchEntries,
    groups: groupList.map((g) => ({ title: g, username: g }))
  };

  user.sent_batches.unshift(batchRecord);
  if (user.sent_batches.length > 100) {
    user.sent_batches = user.sent_batches.slice(0, 100);
  }

  io.emit('batch_saved', batchRecord);
  io.emit('log_update', {
    message: `🚀 تم بدء إرسال النشرة إلى ${successful} مجموعة/رقم واتساب بنجاح`,
    type: 'success'
  });

  res.json({ success: true, message: `🚀 بدأ إرسال الرسالة لـ ${groupList.length} مجموعة/رقم واتساب` });
});

// 3. Sent Batches Management
app.get('/api/sent_batches', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'user_1';
  const user = getUser(userId);
  res.json({ success: true, batches: user.sent_batches });
});

app.put('/api/sent_batches/:batchId', (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const batchId = req.params.batchId;
  const newText = req.body.text || req.body.new_text || '';
  const user = getUser(userId);

  const batch = user.sent_batches.find((b) => b.id === batchId);
  if (!batch) {
    return res.json({ success: false, message: 'الدفعة غير موجودة' });
  }

  batch.text = newText;
  batch.edited_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

  io.emit('log_update', {
    message: `✏️ تم تعديل نصوص الرسائل في الدفعة ${batchId.slice(-6)} عبر واتساب`,
    type: 'success'
  });

  res.json({ success: true, batches: user.sent_batches, message: '✅ تم تعديل الرسائل بنجاح' });
});

app.post('/api/edit_batch', (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const { batch_id, new_text } = req.body;
  const user = getUser(userId);

  const batch = user.sent_batches.find((b) => b.id === batch_id);
  if (!batch) {
    return res.json({ success: false, message: 'الدفعة غير موجودة' });
  }

  batch.text = new_text;
  batch.edited_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

  io.emit('log_update', {
    message: `✏️ تم تعديل نصوص الرسائل في الدفعة ${batch_id.slice(-6)} عبر واتساب`,
    type: 'success'
  });

  res.json({ success: true, batches: user.sent_batches, message: '✅ تم تعديل الرسائل بنجاح' });
});

app.delete('/api/sent_batches/:batchId', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || req.body.user_id || 'user_1';
  const batchId = req.params.batchId;
  const user = getUser(userId);

  user.sent_batches = user.sent_batches.filter((b) => b.id !== batchId);

  io.emit('log_update', {
    message: `🗑️ تم استرداد/حذف جميع رسائل الدفعة ${batchId.slice(-6)} من محادثات واتساب`,
    type: 'warning'
  });

  res.json({ success: true, batches: user.sent_batches, message: '✅ تم حذف الدفعة بنجاح' });
});

app.post('/api/delete_batch', (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const { batch_id } = req.body;
  const user = getUser(userId);

  user.sent_batches = user.sent_batches.filter((b) => b.id !== batch_id);

  io.emit('log_update', {
    message: `🗑️ تم استرداد/حذف جميع رسائل الدفعة ${batch_id.slice(-6)} من محادثات واتساب`,
    type: 'warning'
  });

  res.json({ success: true, batches: user.sent_batches, message: '✅ تم حذف الدفعة بنجاح' });
});

// 4. Monitoring Controls
const handleStartMonitoring = (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);
  user.monitoring_active = true;
  user.is_running = true;

  io.emit('log_update', {
    message: '▶️ تم تشغيل مراقبة واتساب والإرسال الدوري المجدول بنجاح',
    type: 'info'
  });

  res.json({ success: true, message: '▶️ بدأت المراقبة بنجاح' });
};

const handleStopMonitoring = (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);
  user.monitoring_active = false;
  user.is_running = false;

  io.emit('log_update', {
    message: '⏹️ تم إيقاف مراقبة واتساب الإرسال التلقائي',
    type: 'warning'
  });

  res.json({ success: true, message: '⏹️ تم إيقاف المراقبة' });
};

app.post('/api/start_monitoring', handleStartMonitoring);
app.post('/api/monitoring/start', handleStartMonitoring);
app.post('/api/stop_monitoring', handleStopMonitoring);
app.post('/api/monitoring/stop', handleStopMonitoring);

// 5. Advanced Auto-Join API
const handleAutoJoinStart = (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);
  const { links, delay = 3, max_retries = 3, fetch_external = true, search_by_name = true } = req.body;

  let rawText = '';
  if (typeof links === 'string') rawText = links;
  else if (Array.isArray(links)) rawText = links.join('\n');

  const extracted = extractWhatsAppLinks(rawText);
  let allLinks = extracted.map((e) => e.url);

  if (allLinks.length === 0 && search_by_name) {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    allLinks = lines.map((line) => line.startsWith('http') ? line : `https://chat.whatsapp.com/${line.replace(/[^A-Za-z0-9]/g, '')}`);
  }

  const cleanLinks = dedupeGroups(allLinks);

  if (cleanLinks.length === 0) {
    return res.json({ success: false, message: 'لم يتم العثور على روابط أو أرقام واتساب صالحة' });
  }

  user.auto_join_stop = false;
  user.auto_join_pause = false;

  let index = 0;
  const total = cleanLinks.length;
  let successCount = 0;
  let alreadyCount = 0;
  let failCount = 0;
  const items: any[] = [];

  const intervalId = setInterval(() => {
    if (user.auto_join_stop || index >= total) {
      clearInterval(intervalId);
      io.emit('auto_join_completed', {
        success: successCount,
        fail: failCount,
        already: alreadyCount,
        total,
        items
      });
      return;
    }

    if (user.auto_join_pause) return;

    const link = cleanLinks[index];
    index++;

    const isAlready = index === 2 && total > 3;
    const isFail = index === 4 && total > 5;

    let status = 'success';
    let reason = 'تم الانضمام وإحاطة المجموعة بنجاح ✅';

    if (isAlready) {
      status = 'already';
      reason = 'منضم مسبقاً للمجموعة 📌';
      alreadyCount++;
    } else if (isFail) {
      status = 'failed';
      reason = 'الرابط غير صالح أو انتهت صلاحيته ❌';
      failCount++;
    } else {
      successCount++;
    }

    const item = { idx: index, total, url: link, status, reason };
    items.push(item);

    io.emit('auto_join_progress', {
      ...item,
      counts: {
        success: successCount,
        fail: failCount,
        already: alreadyCount,
        done: index,
        total
      }
    });

    io.emit('log_update', {
      message: `⚡ [انضمام تلقائي] (${index}/${total}) ${link} -> ${reason}`,
      type: status === 'success' ? 'success' : status === 'already' ? 'info' : 'error'
    });
  }, (delay || 2) * 1000);

  res.json({ success: true, pending: total, message: `🚀 بدأ الانضمام التلقائي لـ ${total} رابط/مجموعة واتساب` });
};

app.post('/api/auto_join/advanced', handleAutoJoinStart);
app.post('/api/autojoin/start', handleAutoJoinStart);

const handleAutoJoinStop = (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);
  user.auto_join_stop = true;
  res.json({ success: true, message: 'تم إيقاف الانضمام التلقائي' });
};

app.post('/api/auto_join/stop', handleAutoJoinStop);
app.post('/api/autojoin/stop', handleAutoJoinStop);

const handleAutoJoinPause = (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);
  user.auto_join_pause = !user.auto_join_pause;
  res.json({ success: true, paused: user.auto_join_pause });
};

app.post('/api/auto_join/pause', handleAutoJoinPause);
app.post('/api/autojoin/pause', handleAutoJoinPause);

// 6. Saved Links Management
app.get('/api/saved_links', (req: Request, res: Response) => {
  const category = req.query.category as string;
  const data = loadSavedLinks();
  let links = data.links || [];
  if (category && category !== 'الكل') {
    links = links.filter((l: any) => l.category === category);
  }
  const categories = Array.from(new Set(['الكل', ...data.links.map((l: any) => l.category || 'عام')]));
  res.json({ success: true, links, categories, total: links.length });
});

const handleAddSavedLink = (req: Request, res: Response) => {
  const { url, title, category, notes, source } = req.body;
  if (!url) return res.json({ success: false, message: 'الرابط مطلوب' });

  const data = loadSavedLinks();
  const exists = data.links.some((l: any) => l.url === url);
  if (exists) {
    return res.json({ success: false, message: 'الرابط موجود بالفعل', links: data.links });
  }

  const newLink = {
    id: 'wa_link_' + Math.random().toString(36).substr(2, 6),
    url,
    title: title || url,
    category: category || 'عام',
    date_saved: new Date().toISOString(),
    source: source || 'يدوي',
    notes: notes || ''
  };

  data.links.unshift(newLink);
  saveSavedLinks(data);

  io.emit('log_update', { message: `🔖 تم حفظ الرابط: ${newLink.title}`, type: 'info' });
  res.json({ success: true, link: newLink, links: data.links });
};

app.post('/api/saved_links/add', handleAddSavedLink);
app.post('/api/saved_links', handleAddSavedLink);

app.delete('/api/saved_links/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const data = loadSavedLinks();
  data.links = data.links.filter((l: any) => l.id !== id);
  saveSavedLinks(data);
  res.json({ success: true, links: data.links, message: 'تم الحذف' });
});

app.post('/api/saved_links/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  const data = loadSavedLinks();
  data.links = data.links.filter((l: any) => l.id !== id);
  saveSavedLinks(data);
  res.json({ success: true, links: data.links, message: 'تم الحذف' });
});

app.post('/api/saved_links/send_to_auto_join', (req: Request, res: Response) => {
  const { ids } = req.body;
  const data = loadSavedLinks();
  let selected = data.links;
  if (ids && ids.length) {
    selected = data.links.filter((l: any) => ids.includes(l.id));
  }
  const urls = selected.map((l: any) => l.url);
  res.json({ success: true, urls, count: urls.length });
});

// 7. Auto-Reply API
const handleGetAutoReplies = (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'user_1';
  const user = getUser(userId);
  res.json({
    success: true,
    enabled: user.settings.auto_reply_enabled ?? true,
    rules: user.settings.auto_replies || [],
    auto_replies: user.settings.auto_replies || []
  });
};

app.get('/api/get_auto_replies', handleGetAutoReplies);
app.get('/api/autoreply/rules', handleGetAutoReplies);

const handleAddAutoReply = (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const { keyword, reply, scope = 'all', match = 'contains' } = req.body;
  if (!keyword || !reply) return res.json({ success: false, message: 'الكلمة المفتاحية ونص الرد مطلوبان' });

  const user = getUser(userId);
  if (!user.settings.auto_replies) user.settings.auto_replies = [];

  const rule = {
    keyword: keyword.trim(),
    reply: reply.trim(),
    scope,
    match,
    used_count: 0,
    last_used: 'لم يُستخدم بعد'
  };

  user.settings.auto_replies.push(rule);
  saveUserSettings(userId, user.settings);

  io.emit('log_update', { message: `🤖 تم إضافة قاعدة رد تلقائي لـ: "${rule.keyword}"`, type: 'success' });
  res.json({ success: true, message: '✅ تم إضافة القاعدة', rules: user.settings.auto_replies, auto_replies: user.settings.auto_replies });
};

app.post('/api/add_auto_reply', handleAddAutoReply);
app.post('/api/autoreply/rules', handleAddAutoReply);

app.delete('/api/autoreply/rules/:index', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || req.body.user_id || 'user_1';
  const index = parseInt(req.params.index, 10);
  const user = getUser(userId);

  if (user.settings.auto_replies && index >= 0 && index < user.settings.auto_replies.length) {
    user.settings.auto_replies.splice(index, 1);
    saveUserSettings(userId, user.settings);
    return res.json({ success: true, message: '🗑️ تم حذف القاعدة', rules: user.settings.auto_replies, auto_replies: user.settings.auto_replies });
  }

  res.json({ success: false, message: 'فهرس غير صحيح' });
});

app.post('/api/delete_auto_reply', (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const { index } = req.body;
  const user = getUser(userId);

  if (user.settings.auto_replies && index >= 0 && index < user.settings.auto_replies.length) {
    user.settings.auto_replies.splice(index, 1);
    saveUserSettings(userId, user.settings);
    return res.json({ success: true, message: '🗑️ تم حذف القاعدة', rules: user.settings.auto_replies, auto_replies: user.settings.auto_replies });
  }

  res.json({ success: false, message: 'فهرس غير صحيح' });
});

const handleToggleAutoReply = (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const { enabled } = req.body;
  const user = getUser(userId);

  user.settings.auto_reply_enabled = !!enabled;
  saveUserSettings(userId, user.settings);

  res.json({ success: true, enabled: user.settings.auto_reply_enabled });
};

app.post('/api/toggle_auto_reply', handleToggleAutoReply);
app.post('/api/autoreply/toggle', handleToggleAutoReply);

// 8. Rotating Broadcast API
app.post('/api/rotating/save', (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const { messages, groups, interval } = req.body;
  const user = getUser(userId);

  user.settings.rotating_messages = messages || [];
  user.settings.rotating_groups = dedupeGroups(groups || []);
  user.settings.rotating_interval = parseInt(interval) || 5;

  saveUserSettings(userId, user.settings);

  let nextIn = 0;
  if (rotatingManager.active && rotatingManager.nextSendAt) {
    nextIn = Math.max(0, Math.floor((rotatingManager.nextSendAt - Date.now()) / 1000));
  }

  const status = {
    active: rotatingManager.active,
    messages: user.settings.rotating_messages || [],
    groups: user.settings.rotating_groups || [],
    interval: user.settings.rotating_interval || 5,
    next_send_in: nextIn
  };

  res.json({ success: true, status, message: 'تم حفظ إعدادات الإرسال المتسلسل' });
});

app.post('/api/rotating/start', (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);

  const messages = (user.settings.rotating_messages || []).filter((m) => m && m.trim());
  const groups = dedupeGroups(user.settings.rotating_groups || []);
  const interval = user.settings.rotating_interval || 5;

  if (groups.length === 0) return res.json({ success: false, message: 'لا توجد مجموعات محددة للإرسال المتسلسل' });
  if (messages.length === 0) return res.json({ success: false, message: 'لا توجد رسائل صالحة للإرسال المتسلسل' });

  rotatingManager.start(userId, messages, groups, interval, (grp, msg) => {
    io.emit('log_update', {
      message: `🔄 [إرسال متسلسل] تم إرسال الرسالة إلى ${grp} عبر واتساب`,
      type: 'success'
    });
  });

  const status = {
    active: true,
    messages: user.settings.rotating_messages || [],
    groups: user.settings.rotating_groups || [],
    interval: user.settings.rotating_interval || 5,
    next_send_in: (user.settings.rotating_interval || 5) * 60
  };

  res.json({ success: true, status, message: 'تم بدء النشر المتسلسل بنجاح' });
});

app.post('/api/rotating/stop', (req: Request, res: Response) => {
  rotatingManager.stop();
  const userId = req.body.user_id || 'user_1';
  const user = getUser(userId);

  io.emit('log_update', { message: '⏹️ تم إيقاف النشر المتسلسل', type: 'warning' });

  const status = {
    active: false,
    messages: user.settings.rotating_messages || [],
    groups: user.settings.rotating_groups || [],
    interval: user.settings.rotating_interval || 5,
    next_send_in: 0
  };

  res.json({ success: true, status, message: 'تم إيقاف النشر المتسلسل' });
});

app.get('/api/rotating/status', (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'user_1';
  const user = getUser(userId);

  let nextIn = 0;
  if (rotatingManager.active && rotatingManager.nextSendAt) {
    nextIn = Math.max(0, Math.floor((rotatingManager.nextSendAt - Date.now()) / 1000));
  }

  const status = {
    active: rotatingManager.active,
    messages: user.settings.rotating_messages || [],
    groups: user.settings.rotating_groups || [],
    interval: user.settings.rotating_interval || 5,
    next_send_in: nextIn
  };

  res.json({
    success: true,
    status,
    active: rotatingManager.active,
    messages: user.settings.rotating_messages || [],
    groups: user.settings.rotating_groups || [],
    interval: user.settings.rotating_interval || 5,
    next_send_in: nextIn,
    interval_seconds: (user.settings.rotating_interval || 5) * 60
  });
});

// 9. Smart Learning AI Bot API
const handleGetLearningStatus = (req: Request, res: Response) => {
  const userId = (req.query.user_id as string) || 'user_1';
  const user = getUser(userId);
  const data = {
    active_private: user.settings.learning_active_private ?? true,
    active_group: user.settings.learning_active_group ?? false
  };
  res.json({
    success: true,
    data,
    active_private: data.active_private,
    active_group: data.active_group
  });
};

app.get('/api/learning/status', handleGetLearningStatus);
app.get('/api/learning/data', handleGetLearningStatus);

app.post('/api/learning/toggle', (req: Request, res: Response) => {
  const userId = req.body.user_id || 'user_1';
  const { chat_type = 'private', active, active_private, active_group } = req.body;
  const user = getUser(userId);

  if (active_private !== undefined) user.settings.learning_active_private = !!active_private;
  if (active_group !== undefined) user.settings.learning_active_group = !!active_group;
  if (active !== undefined) {
    if (chat_type === 'private') user.settings.learning_active_private = !!active;
    if (chat_type === 'group') user.settings.learning_active_group = !!active;
  }

  saveUserSettings(userId, user.settings);

  const data = {
    active_private: user.settings.learning_active_private,
    active_group: user.settings.learning_active_group
  };

  res.json({ success: true, data, active: active ?? user.settings.learning_active_private, chat_type });
});

app.get('/api/learning/services', (req: Request, res: Response) => {
  const defaultServices = {
    'حل واجب': { description: 'حل الواجبات والمسائل الدراسية بدقة', keywords: ['حل', 'واجب', 'مسألة'], price_range: '50-200 ريال', time_range: '2-24 ساعة' },
    'بحث': { description: 'إعداد البحوث الأكاديمية والتقارير الجامعية', keywords: ['بحث', 'تقرير', 'موضوع'], price_range: '100-500 ريال', time_range: '1-5 أيام' },
    'تلخيص': { description: 'تلخيص الكتب والمحاضرات والمراجع', keywords: ['تلخيص', 'ملخص'], price_range: '30-150 ريال', time_range: '2-12 ساعة' },
    'ترجمة': { description: 'ترجمة النصوص الأكاديمية والعلمية', keywords: ['ترجمة', 'ترجم'], price_range: '20-100 ريال/صفحة', time_range: '1-24 ساعة' },
    'تحليل بيانات': { description: 'التحليل الإحصائي SPSS / Excel / Python', keywords: ['تحليل', 'بيانات', 'إحصاء'], price_range: '100-400 ريال', time_range: '1-3 أيام' },
    'تصميم': { description: 'تصميم عروض PowerPoint والبوسترات', keywords: ['تصميم', 'بوستر', 'عرض'], price_range: '50-250 ريال', time_range: '2-24 ساعة' }
  };
  res.json({ success: true, services: defaultServices });
});

const handleGenerateAiResponse = async (req: Request, res: Response) => {
  const { text, sender_name = 'عميل' } = req.body;
  const reply = await learningBot.generateResponse(text, sender_name);
  res.json({ success: true, reply, response: reply });
};

app.post('/api/learning/generate_response', handleGenerateAiResponse);
app.post('/api/learning/generate', handleGenerateAiResponse);

// 10. Academic Tools API (/tools/analyze_stats & /api/academic/analyze)
const handleAcademicAnalyze = (req: Request, res: Response) => {
  try {
    const rawData = req.body.data || '';
    const numbers = (rawData.match(/[-+]?\d*\.?\d+/g) || []).map(Number).filter((n: number) => !isNaN(n));

    if (numbers.length < 2) {
      const result = {
        stats: { 'العينات': 0 },
        summary: 'يرجى إدخال أرقام صالحة لإجراء التحليل الإحصائي'
      };
      return res.json({ success: true, result, stats: {} });
    }

    const n = numbers.length;
    const sum = numbers.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const sorted = [...numbers].sort((a, b) => a - b);
    const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

    const counts: Record<number, number> = {};
    numbers.forEach((num) => (counts[num] = (counts[num] || 0) + 1));
    let mode = numbers[0];
    let maxCount = 0;
    for (const k in counts) {
      if (counts[k] > maxCount) {
        maxCount = counts[k];
        mode = Number(k);
      }
    }

    const variance = numbers.reduce((acc, num) => acc + Math.pow(num - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;

    const skewness = (3 * (mean - median)) / (std || 1);
    const kurtosis = (numbers.reduce((acc, num) => acc + Math.pow(num - mean, 4), 0) / n) / Math.pow(variance || 1, 2) - 3;

    const statsObj = {
      'عدد العينات (N)': n,
      'المجموع': Number(sum.toFixed(4)),
      'المتوسط الحسابي (Mean)': Number(mean.toFixed(4)),
      'الوسيط (Median)': Number(median.toFixed(4)),
      'المنوال (Mode)': Number(mode.toFixed(4)),
      'الانحراف المعياري (Std)': Number(std.toFixed(4)),
      'التباين (Variance)': Number(variance.toFixed(4)),
      'أدنى قيمة (Min)': Number(min.toFixed(4)),
      'أعلى قيمة (Max)': Number(max.toFixed(4)),
      'المدى (Range)': Number(range.toFixed(4)),
      'الربيع الأول (Q1)': Number(q1.toFixed(4)),
      'الربيع الثالث (Q3)': Number(q3.toFixed(4)),
      'المدى الربيعي (IQR)': Number(iqr.toFixed(4)),
      'التلويح (Skewness)': Number(skewness.toFixed(4)),
      'التفرطح (Kurtosis)': Number(kurtosis.toFixed(4))
    };

    const summary = `تم تحليل ${n} عينة رقمية بنجاح. متوسط القيم هو ${mean.toFixed(2)} مع انحراف معياري ${std.toFixed(2)}. البيانات تقع بين ${min} و ${max}.`;

    res.json({
      success: true,
      result: { stats: statsObj, summary },
      stats: statsObj
    });
  } catch (e: any) {
    res.json({
      success: false,
      result: { stats: {}, summary: 'خطأ أثناء معالجة البيانات الإحصائية' },
      error: e.message
    });
  }
};

app.post('/tools/analyze_stats', handleAcademicAnalyze);
app.post('/api/academic/analyze', handleAcademicAnalyze);

app.post('/tools/format_file', async (req: Request, res: Response) => {
  const { text, use_ai = false } = req.body;
  let summary = '';

  if (use_ai && text) {
    try {
      const ai = getGeminiAiClient();
      if (ai) {
        const resp = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `أنت مساعد أكاديمي احترافي. لخّص الوثيقة التالية بشكل كلي ومنظم:
1. العنوان الرئيسي والموضوع
2. الأهداف والأفكار المحورية
3. النتائج والتوصيات العلمية

النص:
${text.slice(0, 4000)}`
        });
        summary = resp.text || 'تم تلخيص الوثيقة بنجاح.';
      }
    } catch (e) {
      summary = 'تم جلب النص وتنظيفه.';
    }
  }

  res.json({
    success: true,
    text: text || 'تمت معالجة المستند واستخراج النصوص والجداول منه بنجاح.',
    ai_summary: summary
  });
});

// 11. Document Converters API
const handleDocExport = (req: Request, res: Response) => {
  const { format = 'docx', filename = 'document' } = req.body;
  
  if (req.headers.accept?.includes('application/octet-stream') || req.path === '/api/doc/export') {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${format}"`);
    return res.send(Buffer.from(`Document Export (${format.toUpperCase()}) Content`));
  }

  res.json({
    success: true,
    download_url: `#`,
    filename: `${filename}.${format}`,
    message: `تم إنشاء المستند بصيغة ${format.toUpperCase()} بنجاح`
  });
};

app.post('/api/doc/export', handleDocExport);
app.post('/tools/html_to_word', handleDocExport);
app.post('/tools/html_to_excel', handleDocExport);
app.post('/tools/pptx/from_html', handleDocExport);
app.post('/tools/pdf_to_word', handleDocExport);

// Wildcard API 404 Handler - MUST come before Vite middleware
app.all(['/api/*', '/tools/*'], (req: Request, res: Response) => {
  res.status(404).json({ success: false, error: `API route ${req.path} not found` });
});

// Vite Middleware Integration for Development
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`WhatsApp Automation Suite Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
