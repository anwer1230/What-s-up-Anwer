import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { SendMonitorTab } from './components/tabs/SendMonitorTab';
import { BatchesTab } from './components/tabs/BatchesTab';
import { AccountsManagerTab } from './components/tabs/AccountsManagerTab';
import { LinkScraperTab } from './components/tabs/LinkScraperTab';
import { AutoJoinTab } from './components/tabs/AutoJoinTab';
import { SavedLinksTab } from './components/tabs/SavedLinksTab';
import { AutoReplyTab } from './components/tabs/AutoReplyTab';
import { RotatingTab } from './components/tabs/RotatingTab';
import { LearningTab } from './components/tabs/LearningTab';
import { AcademicTab } from './components/tabs/AcademicTab';
import { DocFormatterTab } from './components/tabs/DocFormatterTab';
import { ConnectWhatsAppModal } from './components/ConnectWhatsAppModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { ToastContainer, ToastMessage } from './components/Toast';
import { LiveLogs } from './components/LiveLogs';
import {
  WhatsAppSettings,
  SentBatch,
  SavedLink,
  AutoReplyRule,
  ActivityLog,
  AutoJoinProgressEvent,
  AcademicAnalysisResult,
  SanitizeMode
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('send_monitor');
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isPwaGuideOpen, setIsPwaGuideOpen] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [whatsappDeviceInfo, setWhatsappDeviceInfo] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const socketRef = useRef<any>(null);
  const prevStatusRef = useRef<'connected' | 'disconnected' | 'connecting' | null>(null);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newToast: ToastMessage = { ...toast, id };
    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    // Auto dismiss after 7 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 7000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [stats, setStats] = useState({ sent: 0, errors: 0, received: 0 });
  const [settings, setSettings] = useState<WhatsAppSettings>({
    message: '',
    groups: [],
    watch_words: [],
    sanitize_mode: 'salam',
    send_type: 'manual',
    interval_seconds: 1500,
    schedule_duration_hours: 0
  });

  const [sentBatches, setSentBatches] = useState<SentBatch[]>([]);
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [linkCategories, setLinkCategories] = useState<string[]>(['الكل', 'عام', 'أكاديمي', 'تسويق', 'دعم']);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyRules, setAutoReplyRules] = useState<AutoReplyRule[]>([]);
  const [rotatingStatus, setRotatingStatus] = useState<any>({
    active: false,
    messages: ['', '', '', '', ''],
    groups: [],
    interval: 5
  });
  const [learningData, setLearningData] = useState<any>({
    active_private: true,
    active_group: true,
    services: {}
  });

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [autoJoinProgress, setAutoJoinProgress] = useState<AutoJoinProgressEvent | null>(null);

  // Initialize Socket.io connection & listeners
  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('log', (log: ActivityLog) => {
      setLogs((prev) => [log, ...prev].slice(0, 200));
    });

    socket.on('log_update', (data: { message: string; type?: 'info' | 'success' | 'warning' | 'error' | 'danger' }) => {
      const logType = data.type === 'danger' ? 'error' : (data.type || 'info');
      const newLog: ActivityLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: logType,
        message: data.message
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 200));
    });

    socket.on('whatsapp_status_update', (data: { status: 'connected' | 'disconnected' | 'connecting'; device_info?: any }) => {
      if (data && data.status) {
        const prev = prevStatusRef.current;
        const curr = data.status;
        prevStatusRef.current = curr;

        setWhatsappStatus(curr);
        if (data.device_info) setWhatsappDeviceInfo(data.device_info);

        // Trigger toast notifications on status changes
        if (prev !== null && prev !== curr) {
          if (curr === 'disconnected') {
            addToast({
              type: 'error',
              title: '🚨 انقطاع مفاجئ لاتصال تليجرام!',
              message: 'تم فقدان الاتصال بخادم تليجرام. يرجى إعادة تسجيل الدخول برقم الهاتف والكود فوراً لضمان استمرارية الإرسال والرد التلقائي.',
              actionText: 'إعادة الربط الآن',
              onAction: () => {
                setIsConnectModalOpen(true);
                if (socketRef.current) {
                  socketRef.current.emit('toggle_whatsapp_connection', { status: 'connecting' });
                }
              }
            });
          } else if (curr === 'connected') {
            addToast({
              type: 'success',
              title: '✅ تم استعادة الاتصال بتليجرام',
              message: 'حسابك في Telegram متصل الآن بنجاح وكل الخدمات المجدولة تعمل كالمعتاد.'
            });
          } else if (curr === 'connecting') {
            addToast({
              type: 'warning',
              title: '🔄 جاري الاتصال والمزامنة...',
              message: 'يتم الآن إعادة الاتصال المباشر مع خوادم تليجرام (MTProto).'
            });
          }
        }
      }
    });

    socket.on('sent_batches_update', (batches: SentBatch[]) => {
      setSentBatches(batches);
    });

    socket.on('stats_update', (newStats) => {
      setStats(newStats);
    });

    socket.on('autojoin_progress', (event: AutoJoinProgressEvent) => {
      setAutoJoinProgress(event);
    });

    socket.on('account_switched', (data: any) => {
      if (data?.settings) setSettings(data.settings);
      if (data?.batches) setSentBatches(data.batches);
      if (data?.stats) setStats(data.stats);
      if (data?.rotating_status) {
        setRotatingStatus({
          active: !!data.rotating_status.active,
          messages: data.rotating_status.messages || [],
          groups: data.rotating_status.groups || [],
          interval: data.rotating_status.interval || 5,
          next_send_in: data.rotating_status.next_send_in || 0
        });
      }
      fetchAllData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Safe JSON Fetch Helper
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await res.json();
      }
      return { success: false, error: 'Non-JSON response' };
    } catch (err) {
      console.warn(`Fetch error for ${url}:`, err);
      return { success: false, error: String(err) };
    }
  };

  // Initial Data Fetching
  const fetchAllData = async () => {
    try {
      const [resSet, resBatches, resLinks, resAR, resRot, resLearn, resWaStatus] = await Promise.all([
        safeFetchJson('/api/settings'),
        safeFetchJson('/api/sent_batches'),
        safeFetchJson('/api/saved_links'),
        safeFetchJson('/api/autoreply/rules'),
        safeFetchJson('/api/rotating/status'),
        safeFetchJson('/api/learning/data'),
        safeFetchJson('/api/whatsapp/status')
      ]);

      if (resWaStatus && resWaStatus.success && resWaStatus.status) {
        setWhatsappStatus(resWaStatus.status);
        if (resWaStatus.device_info) setWhatsappDeviceInfo(resWaStatus.device_info);
      }
      if (resSet && resSet.success && resSet.settings) {
        setSettings(resSet.settings);
        setMonitoringActive(!!resSet.monitoring_active);
      }
      if (resBatches && resBatches.success && Array.isArray(resBatches.batches)) {
        setSentBatches(resBatches.batches);
      }
      if (resLinks && resLinks.success && Array.isArray(resLinks.links)) {
        setSavedLinks(resLinks.links);
        setLinkCategories(resLinks.categories || ['الكل', 'عام', 'أكاديمي', 'تسويق']);
      }
      if (resAR && resAR.success) {
        setAutoReplyEnabled(resAR.enabled ?? true);
        setAutoReplyRules(resAR.rules || resAR.auto_replies || []);
      }
      if (resRot && resRot.success) {
        setRotatingStatus(resRot.status || {
          active: !!resRot.active,
          messages: resRot.messages || [],
          groups: resRot.groups || [],
          interval: resRot.interval || 5,
          next_send_in: resRot.next_send_in || 0
        });
      }
      if (resLearn && resLearn.success) {
        setLearningData(resLearn.data || {
          active_private: resLearn.active_private ?? true,
          active_group: resLearn.active_group ?? false
        });
      }
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const handleToggleWhatsAppStatus = (targetStatus?: 'connected' | 'disconnected' | 'connecting', phone?: string) => {
    if (socketRef.current) {
      socketRef.current.emit('toggle_whatsapp_connection', { status: targetStatus, phone });
    } else {
      safeFetchJson('/api/whatsapp/toggle_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, phone })
      });
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handlers for Send & Monitor Tab
  const handleSaveSettings = async (updated: Partial<WhatsAppSettings>) => {
    try {
      const res = await safeFetchJson('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res && res.success && res.settings) setSettings(res.settings);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendNow = async (data: {
    message: string;
    groups: string;
    images: any[];
    send_to_all: boolean;
    action?: SanitizeMode;
  }) => {
    try {
      await safeFetchJson('/api/send_now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      const res = await safeFetchJson('/api/monitoring/start', { method: 'POST' });
      if (res && res.success) setMonitoringActive(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopMonitoring = async () => {
    try {
      const res = await safeFetchJson('/api/monitoring/stop', { method: 'POST' });
      if (res && res.success) setMonitoringActive(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Batches Tab
  const handleEditBatch = async (batchId: string, newText: string) => {
    try {
      const res = await safeFetchJson(`/api/sent_batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText })
      });
      if (res && res.success && Array.isArray(res.batches)) setSentBatches(res.batches);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    try {
      const res = await safeFetchJson(`/api/sent_batches/${batchId}`, {
        method: 'DELETE'
      });
      if (res && res.success && Array.isArray(res.batches)) setSentBatches(res.batches);
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Auto-Join Tab
  const handleStartAutoJoin = async (data: any) => {
    try {
      await safeFetchJson('/api/autojoin/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopAutoJoin = async () => {
    try {
      await safeFetchJson('/api/autojoin/stop', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePauseAutoJoin = async () => {
    try {
      await safeFetchJson('/api/autojoin/pause', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Saved Links Tab
  const handleAddLink = async (data: { url: string; title: string; category: string; notes: string }) => {
    try {
      const res = await safeFetchJson('/api/saved_links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res && res.success && Array.isArray(res.links)) setSavedLinks(res.links);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      const res = await safeFetchJson(`/api/saved_links/${id}`, { method: 'DELETE' });
      if (res && res.success && Array.isArray(res.links)) setSavedLinks(res.links);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendToAutoJoin = async (ids: string[]) => {
    try {
      const targetLinks = savedLinks.filter((l) => ids.includes(l.id)).map((l) => l.url);
      if (!targetLinks.length) return;
      setActiveTab('autojoin');
      await handleStartAutoJoin({
        links: targetLinks.join('\n'),
        delay: 3,
        max_retries: 3,
        fetch_external: true,
        search_by_name: true
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Auto-Reply Tab
  const handleToggleAutoReply = async (enabled: boolean) => {
    try {
      const res = await safeFetchJson('/api/autoreply/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (res && res.success) setAutoReplyEnabled(!!res.enabled);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAutoReplyRule = async (rule: any) => {
    try {
      const res = await safeFetchJson('/api/autoreply/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });
      if (res && res.success && (res.rules || res.auto_replies)) {
        setAutoReplyRules(res.rules || res.auto_replies);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAutoReplyRule = async (index: number) => {
    try {
      const res = await safeFetchJson(`/api/autoreply/rules/${index}`, { method: 'DELETE' });
      if (res && res.success && (res.rules || res.auto_replies)) {
        setAutoReplyRules(res.rules || res.auto_replies);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Rotating Tab
  const handleSaveRotating = async (messages: string[], groups: string[], interval: number) => {
    try {
      const res = await safeFetchJson('/api/rotating/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, groups, interval })
      });
      if (res && res.success && res.status) setRotatingStatus(res.status);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartRotating = async () => {
    try {
      const res = await safeFetchJson('/api/rotating/start', { method: 'POST' });
      if (res && res.success && res.status) setRotatingStatus(res.status);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopRotating = async () => {
    try {
      const res = await safeFetchJson('/api/rotating/stop', { method: 'POST' });
      if (res && res.success && res.status) setRotatingStatus(res.status);
    } catch (e) {
      console.error(e);
    }
  };

  // Handlers for Learning Tab
  const handleToggleLearningActive = async (type: 'private' | 'group', active: boolean) => {
    try {
      const payload = type === 'private' ? { active_private: active } : { active_group: active };
      const res = await safeFetchJson('/api/learning/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res && res.success && res.data) setLearningData(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateAiResponse = async (text: string, senderName?: string): Promise<string> => {
    try {
      const res = await safeFetchJson('/api/learning/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, sender_name: senderName })
      });
      return res.reply || res.response || 'تم التوليد بنجاح';
    } catch (e) {
      return 'حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.';
    }
  };

  // Handlers for Academic & Formatter Tabs
  const handleAnalyzeAcademic = async (input: string): Promise<AcademicAnalysisResult> => {
    try {
      const res = await fetch('/api/academic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: input })
      }).then((r) => r.json());
      return res.result;
    } catch (e) {
      return {
        stats: { 'خطأ': 0 },
        summary: 'حدث خطأ في إجراء التحليل'
      };
    }
  };

  const handleExportDoc = async (format: 'docx' | 'xlsx' | 'pptx' | 'pdf', htmlContent: string) => {
    try {
      const res = await fetch('/api/doc/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, html_content: htmlContent })
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document.${format === 'pdf' ? 'pdf' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-['Cairo',sans-serif] selection:bg-emerald-500 selection:text-zinc-950 pb-16 relative" dir="rtl">
      {/* Toast Notifications Overlay */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* PWA Floating Install Notification Banner */}
      <PwaInstallBanner 
        externalOpenGuide={isPwaGuideOpen} 
        onCloseGuide={() => setIsPwaGuideOpen(false)} 
      />

      {/* Background radial gradient accent */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(255,255,255,0))] pointer-events-none z-0"></div>
      <div className="relative z-10">
      {/* Top Main Header */}
      <Header
        monitoringActive={monitoringActive}
        whatsappStatus={whatsappStatus}
        stats={stats}
        onStartMonitoring={handleStartMonitoring}
        onStopMonitoring={handleStopMonitoring}
        onRefresh={fetchAllData}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenPwaGuide={() => setIsPwaGuideOpen(true)}
      />

      {/* Connect WhatsApp Companion Device Modal */}
      <ConnectWhatsAppModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        status={whatsappStatus}
        onToggleStatus={handleToggleWhatsAppStatus}
      />

      {/* Main Tab Navigation Bar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLoggedIn={whatsappStatus === 'connected'}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {activeTab === 'send_monitor' && (
          <SendMonitorTab
            settings={settings}
            monitoringActive={monitoringActive}
            stats={stats}
            onSaveSettings={handleSaveSettings}
            onSendNow={handleSendNow}
            onStartMonitoring={handleStartMonitoring}
            onStopMonitoring={handleStopMonitoring}
          />
        )}

        {activeTab === 'batches' && (
          <BatchesTab
            batches={sentBatches}
            onEditBatch={handleEditBatch}
            onDeleteBatch={handleDeleteBatch}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsManagerTab
            onAccountSwitched={(acc) => {
              setWhatsappDeviceInfo({
                phone: acc.phone,
                username: acc.username,
                first_name: acc.first_name,
                connected_at: acc.last_sync
              });
              setWhatsappStatus(acc.status === 'connected' ? 'connected' : 'disconnected');
            }}
          />
        )}

        {activeTab === 'link_scraper' && (
          <LinkScraperTab
            onSendToAutoJoin={(urls) => {
              setActiveTab('autojoin');
              handleStartAutoJoin({
                links: urls.join('\n'),
                delay: 3,
                max_retries: 3,
                fetch_external: true,
                search_by_name: true
              });
            }}
            onSaveToSavedLinks={(link) => {
              handleAddLink({
                url: link.url,
                title: link.title,
                category: link.category || 'عام',
                notes: `تم استخراجه من محادثات تليجرام (${link.source || ''})`
              });
            }}
            onNavigateTab={(tab) => setActiveTab(tab as TabType)}
          />
        )}

        {activeTab === 'autojoin' && (
          <AutoJoinTab
            onStartAutoJoin={handleStartAutoJoin}
            onStopAutoJoin={handleStopAutoJoin}
            onPauseAutoJoin={handlePauseAutoJoin}
            progressEvent={autoJoinProgress}
          />
        )}

        {activeTab === 'links' && (
          <SavedLinksTab
            links={savedLinks}
            categories={linkCategories}
            onAddLink={handleAddLink}
            onDeleteLink={handleDeleteLink}
            onSendToAutoJoin={handleSendToAutoJoin}
          />
        )}

        {activeTab === 'autoreply' && (
          <AutoReplyTab
            enabled={autoReplyEnabled}
            rules={autoReplyRules}
            onToggleEnabled={handleToggleAutoReply}
            onAddRule={handleAddAutoReplyRule}
            onDeleteRule={handleDeleteAutoReplyRule}
          />
        )}

        {activeTab === 'rotating' && (
          <RotatingTab
            status={rotatingStatus}
            onSave={handleSaveRotating}
            onStart={handleStartRotating}
            onStop={handleStopRotating}
          />
        )}

        {activeTab === 'learning' && (
          <LearningTab
            activePrivate={learningData.active_private}
            activeGroup={learningData.active_group}
            services={learningData.services || {}}
            onToggleActive={handleToggleLearningActive}
            onGenerateAiResponse={handleGenerateAiResponse}
          />
        )}

        {activeTab === 'academic' && (
          <AcademicTab onAnalyze={handleAnalyzeAcademic} />
        )}

        {activeTab === 'formatter' && (
          <DocFormatterTab onExportDoc={handleExportDoc} />
        )}

        {/* Live Terminal & Logs Feed (hidden on Accounts tab as requested) */}
        {activeTab !== 'accounts' && (
          <LiveLogs logs={logs} onClearLogs={() => setLogs([])} />
        )}

      </main>

      </div>
    </div>
  );
}

export default App;
