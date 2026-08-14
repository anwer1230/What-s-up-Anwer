import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Server,
  Globe,
  Radio,
  Send,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  KeyRound,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Settings2,
  Clock,
  Sparkles,
  Zap,
  Info,
  X,
  Bot,
  MessageSquare,
  Repeat,
  Eye,
  Sliders,
  Save,
  Search,
  Filter,
  LogOut,
  List,
  Grid,
  Activity,
  Power,
  Play,
  Square
} from 'lucide-react';
import { TelegramAccount, AccountProxyConfig, MultiAccountBroadcastResult } from '../../types';

interface AccountsManagerTabProps {
  onAccountSwitched?: (account: TelegramAccount) => void;
}

interface AccountIsolatedWorkspace {
  message: string;
  groups: string[];
  watch_words: string[];
  interval_seconds: number;
  send_type: string;
  sanitize_mode: string;
  smart_required_messages: number;
  auto_reply_enabled: boolean;
  auto_replies: Array<{
    keyword: string;
    reply: string;
    scope: 'all' | 'private' | 'group';
    match: 'contains' | 'exact' | 'regex';
    used_count?: number;
    last_used?: string;
  }>;
  rotating_messages: string[];
  rotating_groups: string[];
  rotating_interval: number;
  learning_active_private: boolean;
  learning_active_group: boolean;
}

export const AccountsManagerTab: React.FC<AccountsManagerTabProps> = ({ onAccountSwitched }) => {
  const [accounts, setAccounts] = useState<TelegramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'has_2fa' | 'proxy'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState<TelegramAccount | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<TelegramAccount | null>(null);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  // Dedicated Isolated Workspace Inspector Modal State
  const [inspectAccount, setInspectAccount] = useState<TelegramAccount | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceSaving, setWorkspaceSaving] = useState(false);
  const [workspaceSavedSuccess, setWorkspaceSavedSuccess] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<'overview' | 'broadcast' | 'autoreply' | 'rotating' | 'monitoring' | 'security'>('overview');
  
  // Workspace Form State for Inspected Account
  const [workspaceData, setWorkspaceData] = useState<AccountIsolatedWorkspace>({
    message: '',
    groups: [],
    watch_words: [],
    interval_seconds: 1500,
    send_type: 'manual',
    sanitize_mode: 'salam',
    smart_required_messages: 3,
    auto_reply_enabled: true,
    auto_replies: [],
    rotating_messages: [],
    rotating_groups: [],
    rotating_interval: 5,
    learning_active_private: true,
    learning_active_group: false
  });

  // Inputs for adding items inside workspace modal
  const [newGroupInput, setNewGroupInput] = useState('');
  const [newWatchWordInput, setNewWatchWordInput] = useState('');
  const [newRotatingMsgInput, setNewRotatingMsgInput] = useState('');
  const [newRotatingGrpInput, setNewRotatingGrpInput] = useState('');
  const [newRuleKeyword, setNewRuleKeyword] = useState('');
  const [newRuleReply, setNewRuleReply] = useState('');
  const [newRuleScope, setNewRuleScope] = useState<'all' | 'private' | 'group'>('all');
  const [newRuleMatch, setNewRuleMatch] = useState<'contains' | 'exact' | 'regex'>('contains');
  const [accountFirstName, setAccountFirstName] = useState('');
  const [accountUsername, setAccountUsername] = useState('');

  // Add Account Wizard State
  const [addStep, setAddStep] = useState<'phone' | 'code' | '2fa' | 'success'>('phone');
  const [newPhone, setNewPhone] = useState('+966');
  const [newSessionName, setNewSessionName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [new2faPassword, setNew2faPassword] = useState('');
  const [has2FaOverride, setHas2FaOverride] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Broadcast Modal State
  const [broadcastMessage, setBroadcastMessage] = useState(
    'مرحباً بكم 🌹 نقدم لكم أسرع وأرقى الخدمات الأكاديمية والبحثية من مركز سرعة إنجاز. نسعد بخدمتكم دائماً!'
  );
  const [broadcastTarget, setBroadcastTarget] = useState<'saved_messages' | 'groups'>('saved_messages');
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState<MultiAccountBroadcastResult[] | null>(null);

  // Proxy Edit State
  const [proxyConfig, setProxyConfig] = useState<AccountProxyConfig>({
    enabled: false,
    type: 'socks5',
    host: '127.0.0.1',
    port: 1080,
    username: '',
    password: ''
  });

  // Fetch accounts on mount
  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      }
    } catch (e) {
      console.error('Failed to fetch accounts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Quick stats
  const totalAccounts = accounts.length;
  const connectedAccounts = accounts.filter((a) => a.status === 'connected').length;
  const secured2FAAccounts = accounts.filter((a) => a.has_2fa).length;
  const proxyAccounts = accounts.filter((a) => a.proxy?.enabled).length;

  // Filtered Accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.session_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'connected') return acc.status === 'connected';
    if (statusFilter === 'has_2fa') return acc.has_2fa;
    if (statusFilter === 'proxy') return acc.proxy?.enabled;
    return true;
  });

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Isolated Workspace Modal for Account
  const handleOpenWorkspace = async (account: TelegramAccount) => {
    setInspectAccount(account);
    setAccountFirstName(account.first_name || '');
    setAccountUsername(account.username || '');
    setWorkspaceLoading(true);
    setWorkspaceSavedSuccess(false);
    setWorkspaceTab('overview');

    try {
      const res = await fetch(`/api/accounts/${account.id}/isolated_workspace`);
      const data = await res.json();
      if (data.success && data.settings) {
        setWorkspaceData({
          message: data.settings.message || '',
          groups: Array.isArray(data.settings.groups) ? data.settings.groups : [],
          watch_words: Array.isArray(data.settings.watch_words) ? data.settings.watch_words : [],
          interval_seconds: data.settings.interval_seconds || 1500,
          send_type: data.settings.send_type || 'manual',
          sanitize_mode: data.settings.sanitize_mode || 'salam',
          smart_required_messages: data.settings.smart_required_messages || 3,
          auto_reply_enabled: data.settings.auto_reply_enabled ?? true,
          auto_replies: Array.isArray(data.settings.auto_replies) ? data.settings.auto_replies : [],
          rotating_messages: Array.isArray(data.settings.rotating_messages) ? data.settings.rotating_messages : [],
          rotating_groups: Array.isArray(data.settings.rotating_groups) ? data.settings.rotating_groups : [],
          rotating_interval: data.settings.rotating_interval || 5,
          learning_active_private: data.settings.learning_active_private ?? true,
          learning_active_group: data.settings.learning_active_group ?? false
        });
      }
    } catch (e) {
      console.error('Failed to load isolated workspace:', e);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // Logout / Disconnect Account
  const handleLogoutAccount = async (account: TelegramAccount, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`هل أنت متأكد من تسجيل الخروج من الحساب (${account.first_name || account.phone})؟ ستتوقف عملياته حتى تسجيل الدخول مجدداً.`)) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/accounts/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: account.id })
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        } else {
          await fetchAccounts();
        }
        if (inspectAccount?.id === account.id) {
          setInspectAccount((prev) => (prev ? { ...prev, status: 'disconnected' } : null));
        }
      }
    } catch (e) {
      console.error('Failed to logout account:', e);
    } finally {
      setLoading(false);
    }
  };

  // Save Isolated Workspace Settings for Account
  const handleSaveWorkspace = async () => {
    if (!inspectAccount) return;
    setWorkspaceSaving(true);
    setWorkspaceSavedSuccess(false);

    try {
      const res = await fetch(`/api/accounts/${inspectAccount.id}/save_isolated_settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workspaceData,
          first_name: accountFirstName,
          username: accountUsername
        })
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaceSavedSuccess(true);
        fetchAccounts();
        setTimeout(() => setWorkspaceSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed saving isolated workspace:', e);
    } finally {
      setWorkspaceSaving(false);
    }
  };

  // Switch Active Account
  const handleSwitchActive = async (account: TelegramAccount) => {
    try {
      const res = await fetch('/api/accounts/switch_active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: account.id })
      });
      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts);
        if (onAccountSwitched) {
          onAccountSwitched(data.active_account);
        }
      }
    } catch (e) {
      console.error('Error switching account:', e);
    }
  };

  // Test Send message from account to 'me'
  const handleTestSend = async (account: TelegramAccount) => {
    try {
      const res = await fetch('/api/accounts/test_send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: account.id })
      });
      const data = await res.json();
      if (data.success) {
        fetchAccounts();
      }
    } catch (e) {
      console.error('Error testing send:', e);
    }
  };

  // Step 1: Send Code
  const handleSendCode = async () => {
    if (!newPhone || newPhone.length < 7) {
      setWizardError('يرجى إدخال رقم هاتف صحيح مع مفتاح الدولة');
      return;
    }
    setWizardLoading(true);
    setWizardError(null);
    try {
      const res = await fetch('/api/accounts/send_code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newPhone,
          session_name: newSessionName || `account_${accounts.length + 1}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setAddStep('code');
      } else {
        setWizardError(data.message || 'فشل إرسال الكود');
      }
    } catch (e: any) {
      setWizardError('تعذر الاتصال بالخادم لإرسال الكود');
    } finally {
      setWizardLoading(false);
    }
  };

  // Step 2: Sign in with Code
  const handleSignInWithCode = async () => {
    if (!newCode) {
      setWizardError('يرجى إدخال كود التحقق');
      return;
    }
    setWizardLoading(true);
    setWizardError(null);
    try {
      const res = await fetch('/api/accounts/sign_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newPhone,
          code: newCode,
          session_name: newSessionName || `account_${accounts.length + 1}`,
          has_2fa_override: has2FaOverride
        })
      });
      const data = await res.json();

      if (data.requires_2fa) {
        setAddStep('2fa');
      } else if (data.success) {
        setAddStep('success');
        fetchAccounts();
      } else {
        setWizardError(data.message || 'فشل التحقق من الكود');
      }
    } catch (e) {
      setWizardError('حدث خطأ أثناء معالجة الكود');
    } finally {
      setWizardLoading(false);
    }
  };

  // Step 3: Verify 2FA Cloud Password
  const handleVerify2FA = async () => {
    if (!new2faPassword) {
      setWizardError('يرجى إدخال كلمة مرور 2FA');
      return;
    }
    setWizardLoading(true);
    setWizardError(null);
    try {
      const res = await fetch('/api/accounts/verify_2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newPhone,
          password: new2faPassword,
          session_name: newSessionName || `account_${accounts.length + 1}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setAddStep('success');
        fetchAccounts();
      } else {
        setWizardError(data.message || 'فشلت مصادقة كلمة المرور 2FA');
      }
    } catch (e) {
      setWizardError('خطأ أثناء التحقق من كلمة السر');
    } finally {
      setWizardLoading(false);
    }
  };

  // Save Proxy for Account
  const handleSaveProxy = async () => {
    if (!showProxyModal) return;
    try {
      const res = await fetch('/api/accounts/update_proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: showProxyModal.id,
          proxy: proxyConfig
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowProxyModal(null);
        fetchAccounts();
      }
    } catch (e) {
      console.error('Error saving proxy:', e);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (permanentTelegram: boolean) => {
    if (!showDeleteModal) return;
    try {
      const endpoint = permanentTelegram ? '/api/accounts/delete_telegram_account' : '/api/accounts/delete';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: showDeleteModal.id,
          reason: 'حذف بناءً على رغبة المستخدم من مركز سرعة إنجاز'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowDeleteModal(null);
        fetchAccounts();
      }
    } catch (e) {
      console.error('Error deleting account:', e);
    }
  };

  // Run Concurrency Broadcast
  const handleRunBroadcast = async () => {
    setBroadcasting(true);
    setBroadcastResults(null);
    try {
      const res = await fetch('/api/accounts/broadcast_all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: broadcastMessage,
          target_type: broadcastTarget
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setBroadcastResults(data.results);
        fetchAccounts();
      }
    } catch (e) {
      console.error('Error in broadcast:', e);
    } finally {
      setBroadcasting(false);
    }
  };

  // Health Check & Sync All
  const handleSyncAll = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/accounts/reconnect_all', { method: 'POST' });
      await fetchAccounts();
    } catch (e) {
      console.error('Error syncing all:', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12" dir="rtl">
      
      {/* Top Banner & Stats Bento */}
      <div className="bg-zinc-900 border border-zinc-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500"></div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                <Users2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
                  <span>إدارة الحسابات المتعددة وعزل الجلسات</span>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                    MTProto Isolation
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  كل حساب يعمل ككيان معزول بالكامل في قاعدة البيانات، مع حفظ إعداداته، قواعد الرد التلقائي، قنوات النشر، وجلساته المستقلة 🔒
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => {
                setAddStep('phone');
                setNewPhone('+966');
                setNewSessionName(`account_${accounts.length + 1}`);
                setNewCode('');
                setNew2faPassword('');
                setWizardError(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حساب معزول جديد</span>
            </button>

            <button
              onClick={() => {
                setBroadcastResults(null);
                setShowBroadcastModal(true);
              }}
              className="px-4 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span>إرسال متزامن للكل (Parallel)</span>
            </button>

            <button
              onClick={handleSyncAll}
              disabled={refreshing}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="إعادة فحص ومزامنة كافة الجلسات"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={() => setShowArchitectureModal(true)}
              className="px-3.5 py-2.5 bg-zinc-800/80 hover:bg-zinc-700 text-purple-300 border border-purple-500/30 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>دليل الحماية والعزل 🛡️</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/70 text-center">
            <span className="text-xs text-zinc-400 font-semibold block">إجمالي الحسابات المعزولة</span>
            <span className="text-xl font-black text-zinc-100 mt-0.5 block">{totalAccounts}</span>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/70 text-center">
            <span className="text-xs text-zinc-400 font-semibold block">الجلسات المتصلة</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">{connectedAccounts}</span>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/70 text-center">
            <span className="text-xs text-zinc-400 font-semibold block">محمية بالتحقق 2FA</span>
            <span className="text-xl font-black text-purple-400 mt-0.5 block">{secured2FAAccounts}</span>
          </div>

          <div className="bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/70 text-center">
            <span className="text-xs text-zinc-400 font-semibold block">بروكسي نشط (IP Isolation)</span>
            <span className="text-xl font-black text-sky-400 mt-0.5 block">{proxyAccounts}</span>
          </div>
        </div>
      </div>

      {/* Search, Filter & View Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالرقم، الاسم، أو اسم المستخدم..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {/* Status Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'all' ? 'bg-zinc-700 text-white' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              الكل ({accounts.length})
            </button>
            <button
              onClick={() => setStatusFilter('connected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'connected' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              متصل ({connectedAccounts})
            </button>
            <button
              onClick={() => setStatusFilter('has_2fa')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'has_2fa' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2FA ({secured2FAAccounts})
            </button>
            <button
              onClick={() => setStatusFilter('proxy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'proxy' ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40' : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              بروكسي ({proxyAccounts})
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="عرض القائمة التفصيلية"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="عرض البطاقات"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TABLE LIST VIEW (استعراض تفصيلي للحسابات المسجلة مع زر تسجيل الخروج) */}
      {/* ========================================================================= */}
      {viewMode === 'table' && filteredAccounts.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800/90 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs" dir="rtl">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">الحساب والجلسة</th>
                  <th className="py-3.5 px-4 font-semibold">حالة الاتصال</th>
                  <th className="py-3.5 px-4 font-semibold">الوظائف والمهام الموكلة</th>
                  <th className="py-3.5 px-4 font-semibold text-center">الإحصائيات (مرسل/مستلم)</th>
                  <th className="py-3.5 px-4 font-semibold text-center">الإجراءات والتحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredAccounts.map((acc) => {
                  const isActive = acc.is_active;
                  return (
                    <tr
                      key={acc.id}
                      onClick={() => handleOpenWorkspace(acc)}
                      className={`hover:bg-zinc-800/40 transition-colors cursor-pointer group ${
                        isActive ? 'bg-emerald-500/[0.04]' : ''
                      }`}
                    >
                      {/* Account Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center font-bold text-sm text-zinc-200 shrink-0 relative">
                            {acc.first_name ? acc.first_name.charAt(0) : 'T'}
                            <span
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                                acc.status === 'connected'
                                  ? 'bg-emerald-500'
                                  : acc.status === '2fa_needed'
                                  ? 'bg-amber-500'
                                  : acc.status === 'flood_wait'
                                  ? 'bg-purple-500'
                                  : 'bg-rose-500'
                              }`}
                            ></span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                                {acc.first_name || 'حساب تليجرام'}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  النشط
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-sky-400 text-[11px] dir-ltr text-right">{acc.phone}</span>
                              {acc.username && (
                                <span className="text-zinc-500 text-[11px]">{acc.username}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Connection Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          {acc.status === 'connected' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>متصل وجاهز</span>
                            </span>
                          ) : acc.status === 'flood_wait' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[11px] font-semibold w-fit">
                              <Clock className="w-3 h-3 text-rose-400" />
                              <span>انتظار ({acc.flood_wait_seconds || 300}s)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700 text-[11px] font-semibold w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                              <span>غير متصل</span>
                            </span>
                          )}

                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5" />
                            <span>{acc.session_name}.session</span>
                          </span>
                        </div>
                      </td>

                      {/* Assigned Jobs & Tasks */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300">
                            <Send className="w-2.5 h-2.5 text-emerald-400" />
                            <span>نشر مستقل</span>
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300">
                            <Bot className="w-2.5 h-2.5 text-sky-400" />
                            <span>ردود تلقائية</span>
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300">
                            <Eye className="w-2.5 h-2.5 text-amber-400" />
                            <span>مراقبة ورصد</span>
                          </span>

                          {acc.proxy?.enabled && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono">
                              <Globe className="w-2.5 h-2.5" />
                              <span>Proxy</span>
                            </span>
                          )}

                          {acc.has_2fa && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]">
                              <Lock className="w-2.5 h-2.5" />
                              <span>2FA</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-3 bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800/80 font-mono text-[11px]">
                          <span className="text-zinc-400" title="إجمالي الرسائل المرسلة">{acc.stats?.sent || 0} 📤</span>
                          <span className="text-emerald-400" title="إجمالي الرسائل المستلمة">{acc.stats?.received || 0} 📥</span>
                          {Boolean(acc.stats?.errors) && (
                            <span className="text-rose-400" title="الأخطاء">{acc.stats?.errors} ⚠️</span>
                          )}
                        </div>
                      </td>

                      {/* Prominent Action Controls */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Open Workspace / Settings & Tasks Button */}
                          <button
                            onClick={() => handleOpenWorkspace(acc)}
                            className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                            title="عرض الإعدادات المحفوظة والمهام والوضائف"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>استعراض الإعدادات والمهام</span>
                          </button>

                          {/* Prominent Logout Button */}
                          <button
                            onClick={(e) => handleLogoutAccount(acc, e)}
                            className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                            title="تسجيل الخروج من الحساب وإيقاف عملياته"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>تسجيل خروج</span>
                          </button>

                          {/* Test Send */}
                          <button
                            onClick={() => handleTestSend(acc)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all cursor-pointer"
                            title="فحص الجلسة (إرسال إلى Saved Messages)"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Switch Active */}
                          {!isActive && (
                            <button
                              onClick={() => handleSwitchActive(acc)}
                              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
                              title="تعيين كأساسي"
                            >
                              أساسي
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => setShowDeleteModal(acc)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CARD GRID VIEW (بطاقات الحسابات مع أزرار التحكم وتسجيل الخروج)          */}
      {/* ========================================================================= */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const isActive = acc.is_active;
            return (
              <div
                key={acc.id}
                onClick={() => handleOpenWorkspace(acc)}
                className={`bg-zinc-900 border rounded-3xl p-5 shadow-xl transition-all relative flex flex-col justify-between cursor-pointer group ${
                  isActive
                    ? 'border-emerald-500/60 ring-1 ring-emerald-500/30 bg-gradient-to-b from-zinc-900 to-zinc-900/90'
                    : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Header Row: Active Badge & Logout Button */}
                <div className="flex items-center justify-between mb-3">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-3 h-3 fill-emerald-400" />
                      <span>مساحة العمل النشطة</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {acc.session_name}.session
                    </span>
                  )}

                  {/* Prominent Card Logout Button */}
                  <button
                    onClick={(e) => handleLogoutAccount(acc, e)}
                    className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="تسجيل خروج من هذا الحساب"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>تسجيل خروج</span>
                  </button>
                </div>

                <div>
                  {/* Account Header */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-base text-zinc-200 shrink-0 relative">
                      {acc.first_name ? acc.first_name.charAt(0) : 'T'}
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${
                          acc.status === 'connected'
                            ? 'bg-emerald-500'
                            : acc.status === '2fa_needed'
                            ? 'bg-amber-500'
                            : acc.status === 'flood_wait'
                            ? 'bg-purple-500'
                            : 'bg-rose-500'
                        }`}
                      ></span>
                    </div>

                    <div className="overflow-hidden pr-1">
                      <h3 className="font-bold text-zinc-100 text-sm truncate group-hover:text-emerald-400 transition-colors">
                        {acc.first_name || 'حساب تليجرام'}
                      </h3>
                      <p className="text-xs text-sky-400 font-mono mt-0.5 dir-ltr text-right">{acc.phone}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{acc.username || '@username'}</p>
                    </div>
                  </div>

                  {/* Badges Info */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {/* 2FA Badge */}
                    {acc.has_2fa ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[11px] font-semibold">
                        <Lock className="w-3 h-3 text-purple-400" />
                        <span>2FA نشط</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 text-[11px]">
                        <span>بدون 2FA</span>
                      </span>
                    )}

                    {/* Proxy Badge */}
                    {acc.proxy?.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 text-[11px] font-mono">
                        <Globe className="w-3 h-3 text-sky-400" />
                        <span>{acc.proxy.type.toUpperCase()}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 text-[11px]">
                        <span>Direct IP</span>
                      </span>
                    )}

                    {/* Status Indicator */}
                    {acc.status === 'flood_wait' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 text-[11px] font-semibold animate-pulse">
                        <Clock className="w-3 h-3 text-rose-400" />
                        <span>FloodWait ({acc.flood_wait_seconds || 300}s)</span>
                      </span>
                    )}
                  </div>

                  {/* Active Tasks & Capabilities */}
                  <div className="mt-3 p-2.5 bg-zinc-950/70 rounded-2xl border border-zinc-800/60 text-xs space-y-1">
                    <div className="text-[11px] text-zinc-400 font-bold flex items-center justify-between">
                      <span>الوظائف والمهام الموكلة:</span>
                      <span className="text-[10px] text-emerald-400 font-normal">جاهز للعمل</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded-md text-[10px]">نشر مستقل</span>
                      <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded-md text-[10px]">ردود تلقائية</span>
                      <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 rounded-md text-[10px]">مراقبة الكلمات</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 bg-zinc-950/70 rounded-2xl border border-zinc-800/60 text-center text-xs">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">المرسل</span>
                      <span className="font-bold text-zinc-200">{acc.stats?.sent || 0}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">المستلم</span>
                      <span className="font-bold text-emerald-400">{acc.stats?.received || 0}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">الأخطاء</span>
                      <span className="font-bold text-rose-400">{acc.stats?.errors || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Main Action: Open Settings & Tasks */}
                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenWorkspace(acc)}
                    className="w-full py-2.5 bg-zinc-800/90 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:border-emerald-500/50"
                  >
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>استعراض الإعدادات والمهام المحفوظة</span>
                  </button>
                </div>

                {/* Secondary Action Buttons */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1.5">
                    {!isActive && (
                      <button
                        onClick={() => handleSwitchActive(acc)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        title="تعيين كحساب أساسي للعمليات الفردية"
                      >
                        تعيين كأساسي
                      </button>
                    )}

                    <button
                      onClick={() => handleTestSend(acc)}
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      title="إرسال رسالة تجريبية إلى الرسائل المحفوظة (Saved Messages / me)"
                    >
                      <Send className="w-3 h-3" />
                      <span>فحص</span>
                    </button>

                    <button
                      onClick={() => {
                        setProxyConfig(
                          acc.proxy || {
                            enabled: false,
                            type: 'socks5',
                            host: '127.0.0.1',
                            port: 1080,
                            username: '',
                            password: ''
                          }
                        );
                        setShowProxyModal(acc);
                      }}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl transition-all cursor-pointer"
                      title="تعديل البروكسي لهذا الحساب"
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setShowDeleteModal(acc)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    title="حذف الجلسة أو إلغاء الحساب"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {filteredAccounts.length === 0 && !loading && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
          <Users2 className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-zinc-200">
            {accounts.length === 0 ? 'لا توجد حسابات مضافة حالياً' : 'لا توجد نتائج مطابقة للبحث'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-5">
            {accounts.length === 0
              ? 'ابدأ بإضافة حسابك الأول للاستفادة من مزايا الإرسال المتزامن، وتجاوز حدود تليجرام عبر عزل الجلسات.'
              : 'جرب البحث برقم آخر أو قم بإلغاء الفلتر الحالي.'}
          </p>
          {accounts.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حسابك الأول</span>
            </button>
          )}
        </div>
      )}

      {/* =============================================================== */}
      {/* 0. DEDICATED ISOLATED WORKSPACE MODAL (PER-ACCOUNT PREFERENCES) */}
      {/* =============================================================== */}
      {inspectAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl text-zinc-100 relative max-h-[92vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-zinc-950 px-5 sm:px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  {inspectAccount.first_name?.charAt(0) || 'T'}
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-zinc-100 flex items-center gap-2">
                    <span>مساحة العمل المعزولة: {inspectAccount.first_name || inspectAccount.phone}</span>
                    {inspectAccount.is_active && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/40">
                        النشط حالياً
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono dir-ltr text-right">{inspectAccount.phone} | {inspectAccount.session_name}.session</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!inspectAccount.is_active && (
                  <button
                    onClick={() => {
                      handleSwitchActive(inspectAccount);
                      setInspectAccount({ ...inspectAccount, is_active: true });
                    }}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    تبديل كمساحة نشطة
                  </button>
                )}
                <button
                  onClick={() => setInspectAccount(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Success Toast */}
            {workspaceSavedSuccess && (
              <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تم حفظ وتثبيت كافة تفضيلات وقواعد الحساب ككيان مستقل ومعزول في قاعدة البيانات!</span>
                </div>
              </div>
            )}

            {/* Sub-Tabs Nav */}
            <div className="flex items-center gap-1.5 px-6 py-2.5 bg-zinc-950/70 border-b border-zinc-800/80 overflow-x-auto shrink-0">
              <button
                onClick={() => setWorkspaceTab('overview')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  workspaceTab === 'overview'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>نظرة عامة والمهام النشطة</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('broadcast')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  workspaceTab === 'broadcast'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>رسالة النشر والقنوات ({workspaceData.groups.length})</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('autoreply')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  workspaceTab === 'autoreply'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>قواعد الرد التلقائي ({workspaceData.auto_replies.length})</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('rotating')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  workspaceTab === 'rotating'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>النشر المتسلسل ({workspaceData.rotating_messages.length})</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('monitoring')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  workspaceTab === 'monitoring'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>المراقبة والكلمات ({workspaceData.watch_words.length})</span>
              </button>

              <button
                onClick={() => setWorkspaceTab('security')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  workspaceTab === 'security'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>الهوية والأمان</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {workspaceLoading ? (
                <div className="py-16 text-center text-zinc-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  <span>جاري تحميل مساحة العمل المعزولة للحساب...</span>
                </div>
              ) : (
                <>
                  {/* TAB 0: OVERVIEW & ACTIVE TASKS / FUNCTIONS */}
                  {workspaceTab === 'overview' && (
                    <div className="space-y-4">
                      {/* Top Account Overview & Quick Action Card */}
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-100 text-sm">{inspectAccount.first_name || 'حساب تليجرام'}</span>
                            <span className="text-zinc-400 font-mono text-xs dir-ltr">{inspectAccount.phone}</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            حالة الجلسة: <span className="text-emerald-400 font-bold font-mono">{inspectAccount.status}</span> | ملف الجلسة: <code className="text-zinc-300">{inspectAccount.session_name}.session</code>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {/* Test Send */}
                          <button
                            onClick={() => handleTestSend(inspectAccount)}
                            className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold flex items-center gap-1 text-xs cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>فحص الجلسة</span>
                          </button>

                          {/* Modal Logout Button */}
                          <button
                            onClick={() => handleLogoutAccount(inspectAccount)}
                            className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/30 rounded-xl font-bold flex items-center gap-1 text-xs cursor-pointer transition-all"
                            title="تسجيل الخروج من الحساب"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>تسجيل خروج</span>
                          </button>
                        </div>
                      </div>

                      {/* Active Functions & Assigned Modules Grid */}
                      <div>
                        <h4 className="font-bold text-zinc-200 text-xs mb-2 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <span>الوظائف والمهام التي يعمل عليها هذا الحساب حالياً:</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Function 1: Broadcast & Target Channels */}
                          <div
                            onClick={() => setWorkspaceTab('broadcast')}
                            className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition-colors cursor-pointer space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-200 flex items-center gap-1.5 text-xs">
                                <Send className="w-3.5 h-3.5 text-emerald-400" />
                                <span>1. نشر الإعلانات والقنوات المستهدفة</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {workspaceData.groups.length} قنوات
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 line-clamp-2">
                              {workspaceData.message || 'لم يتم تعيين نص إعلان مخصص لهذا الحساب بعد.'}
                            </p>
                            <div className="text-[10px] text-zinc-500 flex items-center gap-2 pt-1 border-t border-zinc-900">
                              <span>الفاصل: {workspaceData.interval_seconds} ثانية</span>
                              <span>•</span>
                              <span>التعقيم: {workspaceData.sanitize_mode}</span>
                            </div>
                          </div>

                          {/* Function 2: Auto-Replies Rules */}
                          <div
                            onClick={() => setWorkspaceTab('autoreply')}
                            className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition-colors cursor-pointer space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-200 flex items-center gap-1.5 text-xs">
                                <Bot className="w-3.5 h-3.5 text-sky-400" />
                                <span>2. قواعد الرد التلقائي</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                workspaceData.auto_reply_enabled
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}>
                                {workspaceData.auto_reply_enabled ? 'مفعل' : 'معطل'} ({workspaceData.auto_replies.length} قواعد)
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400">
                              يقوم بالرد التلقائي الفوري بناءً على الكلمات المفتاحية المحددة في المحادثات والمجموعات.
                            </p>
                            <div className="text-[10px] text-sky-400 font-mono pt-1 border-t border-zinc-900">
                              انقر لتعديل أو إضافة قواعد رد جديدة →
                            </div>
                          </div>

                          {/* Function 3: Rotating Messages */}
                          <div
                            onClick={() => setWorkspaceTab('rotating')}
                            className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition-colors cursor-pointer space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-200 flex items-center gap-1.5 text-xs">
                                <Repeat className="w-3.5 h-3.5 text-purple-400" />
                                <span>3. النشر المتسلسل والدوري</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                {workspaceData.rotating_messages.length} رسائل دورية
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400">
                              تبديل الرسائل آلياً كل {workspaceData.rotating_interval} دقيقة لمنع التكرار والحظر.
                            </p>
                            <div className="text-[10px] text-purple-400 font-mono pt-1 border-t border-zinc-900">
                              مجموعات النشر الدوري: {workspaceData.rotating_groups.length} مجموعات
                            </div>
                          </div>

                          {/* Function 4: Live Keyword Monitoring */}
                          <div
                            onClick={() => setWorkspaceTab('monitoring')}
                            className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 hover:border-emerald-500/40 transition-colors cursor-pointer space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-zinc-200 flex items-center gap-1.5 text-xs">
                                <Eye className="w-3.5 h-3.5 text-amber-400" />
                                <span>4. المراقبة ورصد الكلمات</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {workspaceData.watch_words.length} كلمات مرصودة
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400">
                              مراقبة المجموعات التي انضم لها هذا الحساب ورصد أي طلبات ومشاريع جديدة فور كتابتها.
                            </p>
                            <div className="text-[10px] text-amber-400 font-mono pt-1 border-t border-zinc-900">
                              الكلمات: {workspaceData.watch_words.slice(0, 3).join(', ') || 'لا توجد كلمات'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Network & Identity Isolation Info */}
                      <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-200 text-xs block">عزل الشبكة (IP / Proxy Isolation)</span>
                            <span className="text-[11px] text-zinc-400">
                              {inspectAccount.proxy?.enabled
                                ? `يعمل عبر بروكسي مخصص (${inspectAccount.proxy.type.toUpperCase()}: ${inspectAccount.proxy.host})`
                                : 'يعمل عبر الاتصال المباشر (Direct IP) - يمكنك تعيين بروكسي مستقل'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setProxyConfig(
                              inspectAccount.proxy || {
                                enabled: false,
                                type: 'socks5',
                                host: '127.0.0.1',
                                port: 1080,
                                username: '',
                                password: ''
                              }
                            );
                            setShowProxyModal(inspectAccount);
                          }}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-sky-400 border border-sky-500/30 rounded-xl font-bold text-xs cursor-pointer"
                        >
                          إعدادات البروكسي
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 1: BROADCAST & CHANNELS */}
                  {workspaceTab === 'broadcast' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                          نص رسالة النشر الخاصة بهذا الحساب فقط:
                        </label>
                        <textarea
                          rows={4}
                          value={workspaceData.message}
                          onChange={(e) => setWorkspaceData({ ...workspaceData, message: e.target.value })}
                          placeholder="اكتب نص الإعلان أو الرسالة الخاصة بهذا الحساب..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
                        />
                      </div>

                      {/* Groups & Channels */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                          قنوات ومجموعات النشر المحددة لهذا الحساب ({workspaceData.groups.length}):
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newGroupInput}
                            onChange={(e) => setNewGroupInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newGroupInput.trim()) {
                                if (!workspaceData.groups.includes(newGroupInput.trim())) {
                                  setWorkspaceData({ ...workspaceData, groups: [...workspaceData.groups, newGroupInput.trim()] });
                                }
                                setNewGroupInput('');
                              }
                            }}
                            placeholder="https://t.me/group_name أو @channel_name..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newGroupInput.trim() && !workspaceData.groups.includes(newGroupInput.trim())) {
                                setWorkspaceData({ ...workspaceData, groups: [...workspaceData.groups, newGroupInput.trim()] });
                                setNewGroupInput('');
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                          >
                            إضافة قناة
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-zinc-950 rounded-2xl border border-zinc-800/80">
                          {workspaceData.groups.length === 0 ? (
                            <span className="text-zinc-500 text-[11px] p-1">لا توجد قنوات محددة لهذا الحساب بعد.</span>
                          ) : (
                            workspaceData.groups.map((grp, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono"
                              >
                                <span>{grp}</span>
                                <button
                                  type="button"
                                  onClick={() => setWorkspaceData({
                                    ...workspaceData,
                                    groups: workspaceData.groups.filter((_, i) => i !== idx)
                                  })}
                                  className="text-zinc-500 hover:text-rose-400"
                                >
                                  ×
                                </button>
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1">الفاصل الزمني بين الرسائل (ثواني):</label>
                          <input
                            type="number"
                            value={workspaceData.interval_seconds}
                            onChange={(e) => setWorkspaceData({ ...workspaceData, interval_seconds: parseInt(e.target.value) || 1500 })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1">نوع التعقيم وتخطي الفلترة:</label>
                          <select
                            value={workspaceData.sanitize_mode}
                            onChange={(e) => setWorkspaceData({ ...workspaceData, sanitize_mode: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                          >
                            <option value="salam">بدء بالسلام (السلام عليكم ورحمة الله 🌹)</option>
                            <option value="quote">اقتباس إسلامي مع دمج</option>
                            <option value="none">بدون تعديل (النص الخام)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: AUTO-REPLY RULES */}
                  {workspaceTab === 'autoreply' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <div>
                          <span className="font-bold text-zinc-200 block">تفعيل الرد التلقائي لهذا الحساب</span>
                          <span className="text-[11px] text-zinc-500">يقوم بالرد الفوري على الرسائل التي تطابق الكلمات المحددة</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={workspaceData.auto_reply_enabled}
                          onChange={(e) => setWorkspaceData({ ...workspaceData, auto_reply_enabled: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                      </div>

                      {/* Add New Rule Box */}
                      <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-2.5">
                        <span className="font-bold text-zinc-200 text-xs block">إضافة قاعدة رد تلقائي جديدة:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={newRuleKeyword}
                            onChange={(e) => setNewRuleKeyword(e.target.value)}
                            placeholder="الكلمة المفتاحية (مثال: أسعار، تليجرام، استفسار)..."
                            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newRuleScope}
                              onChange={(e) => setNewRuleScope(e.target.value as any)}
                              className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-100"
                            >
                              <option value="all">الكل (خاص + مجموعات)</option>
                              <option value="private">المحادثات الخاصة فقط</option>
                              <option value="group">المجموعات فقط</option>
                            </select>
                            <select
                              value={newRuleMatch}
                              onChange={(e) => setNewRuleMatch(e.target.value as any)}
                              className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-100"
                            >
                              <option value="contains">تحتوي الكلمة</option>
                              <option value="exact">مطابقة تامة</option>
                              <option value="regex">تعبير نمطي (Regex)</option>
                            </select>
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          value={newRuleReply}
                          onChange={(e) => setNewRuleReply(e.target.value)}
                          placeholder="نص الرد التلقائي الذي سيتم إرساله للعميل..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newRuleKeyword.trim() && newRuleReply.trim()) {
                              setWorkspaceData({
                                ...workspaceData,
                                auto_replies: [
                                  ...workspaceData.auto_replies,
                                  {
                                    keyword: newRuleKeyword.trim(),
                                    reply: newRuleReply.trim(),
                                    scope: newRuleScope,
                                    match: newRuleMatch,
                                    used_count: 0
                                  }
                                ]
                              });
                              setNewRuleKeyword('');
                              setNewRuleReply('');
                            }
                          }}
                          disabled={!newRuleKeyword.trim() || !newRuleReply.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          + إضافة القاعدة لقائمة هذا الحساب
                        </button>
                      </div>

                      {/* Rules List */}
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {workspaceData.auto_replies.length === 0 ? (
                          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-center text-zinc-500 text-xs">
                            لا توجد قواعد رد تلقائي محددة لهذا الحساب حتى الآن.
                          </div>
                        ) : (
                          workspaceData.auto_replies.map((rule, idx) => (
                            <div key={idx} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-emerald-400">{rule.keyword}</span>
                                  <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded-md text-[10px]">
                                    {rule.scope === 'all' ? 'عام' : rule.scope === 'private' ? 'خاص' : 'مجموعات'}
                                  </span>
                                  <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 rounded-md text-[10px]">
                                    {rule.match}
                                  </span>
                                </div>
                                <p className="text-zinc-300 text-xs">{rule.reply}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setWorkspaceData({
                                  ...workspaceData,
                                  auto_replies: workspaceData.auto_replies.filter((_, i) => i !== idx)
                                })}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                title="حذف القاعدة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: ROTATING BROADCAST */}
                  {workspaceTab === 'rotating' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                          الرسائل الدورية المتسلسلة (تُرسل بالتناوب):
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newRotatingMsgInput}
                            onChange={(e) => setNewRotatingMsgInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newRotatingMsgInput.trim()) {
                                setWorkspaceData({
                                  ...workspaceData,
                                  rotating_messages: [...workspaceData.rotating_messages, newRotatingMsgInput.trim()]
                                });
                                setNewRotatingMsgInput('');
                              }
                            }}
                            placeholder="أضف نص رسالة متسلسلة جديدة..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newRotatingMsgInput.trim()) {
                                setWorkspaceData({
                                  ...workspaceData,
                                  rotating_messages: [...workspaceData.rotating_messages, newRotatingMsgInput.trim()]
                                });
                                setNewRotatingMsgInput('');
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                          >
                            إضافة رسالة
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {workspaceData.rotating_messages.map((msg, idx) => (
                            <div key={idx} className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 flex items-center justify-between text-xs">
                              <span className="text-zinc-200 truncate">{msg}</span>
                              <button
                                type="button"
                                onClick={() => setWorkspaceData({
                                  ...workspaceData,
                                  rotating_messages: workspaceData.rotating_messages.filter((_, i) => i !== idx)
                                })}
                                className="text-zinc-500 hover:text-rose-400 px-2"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1">الفاصل بين الرسائل (بالدقائق):</label>
                          <input
                            type="number"
                            value={workspaceData.rotating_interval}
                            onChange={(e) => setWorkspaceData({ ...workspaceData, rotating_interval: parseInt(e.target.value) || 5 })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1">قنوات الإرسال المتسلسل:</label>
                          <input
                            type="text"
                            value={newRotatingGrpInput}
                            onChange={(e) => setNewRotatingGrpInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newRotatingGrpInput.trim()) {
                                setWorkspaceData({
                                  ...workspaceData,
                                  rotating_groups: [...workspaceData.rotating_groups, newRotatingGrpInput.trim()]
                                });
                                setNewRotatingGrpInput('');
                              }
                            }}
                            placeholder="أضف معرف قناة للإرسال المتسلسل..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 dir-ltr text-right"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: MONITORING & KEYWORDS */}
                  {workspaceTab === 'monitoring' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                          الكلمات المفتاحية المراقبة لهذا الحساب ({workspaceData.watch_words.length}):
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={newWatchWordInput}
                            onChange={(e) => setNewWatchWordInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newWatchWordInput.trim()) {
                                setWorkspaceData({
                                  ...workspaceData,
                                  watch_words: [...workspaceData.watch_words, newWatchWordInput.trim()]
                                });
                                setNewWatchWordInput('');
                              }
                            }}
                            placeholder="أضف كلمة مراقبة (مثل: واجب، ترجمة، مشروع، تسعير)..."
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newWatchWordInput.trim()) {
                                setWorkspaceData({
                                  ...workspaceData,
                                  watch_words: [...workspaceData.watch_words, newWatchWordInput.trim()]
                                });
                                setNewWatchWordInput('');
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold cursor-pointer"
                          >
                            إضافة كلمة
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 p-2.5 bg-zinc-950 rounded-2xl border border-zinc-800 max-h-36 overflow-y-auto">
                          {workspaceData.watch_words.map((word, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200"
                            >
                              <span>{word}</span>
                              <button
                                type="button"
                                onClick={() => setWorkspaceData({
                                  ...workspaceData,
                                  watch_words: workspaceData.watch_words.filter((_, i) => i !== idx)
                                })}
                                className="text-zinc-500 hover:text-rose-400"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-300">التعلم الذكي من المحادثات الخاصة:</span>
                          <input
                            type="checkbox"
                            checked={workspaceData.learning_active_private}
                            onChange={(e) => setWorkspaceData({ ...workspaceData, learning_active_private: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-300">التعلم الذكي من المجموعات:</span>
                          <input
                            type="checkbox"
                            checked={workspaceData.learning_active_group}
                            onChange={(e) => setWorkspaceData({ ...workspaceData, learning_active_group: e.target.checked })}
                            className="w-4 h-4 rounded text-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: IDENTITY & SECURITY */}
                  {workspaceTab === 'security' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1">الاسم التعريفي للحساب:</label>
                          <input
                            type="text"
                            value={accountFirstName}
                            onChange={(e) => setAccountFirstName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 mb-1">اسم المستخدم (@username):</label>
                          <input
                            type="text"
                            value={accountUsername}
                            onChange={(e) => setAccountUsername(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 dir-ltr text-right"
                          />
                        </div>
                      </div>

                      <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2 text-[11px] text-zinc-400">
                        <div className="flex justify-between">
                          <span>معرف الجلسة (Session ID):</span>
                          <span className="font-mono text-zinc-200">{inspectAccount.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ملف الجلسة المعزول:</span>
                          <span className="font-mono text-emerald-400">{inspectAccount.session_name}.session</span>
                        </div>
                        <div className="flex justify-between">
                          <span>حالة التحقق بخطوتين:</span>
                          <span className="font-semibold text-purple-400">{inspectAccount.has_2fa ? '2FA مفعل (SRP Handshake)' : 'غير مفعل'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>البروكسي وعزل الـ IP:</span>
                          <span className="font-mono text-sky-400">
                            {inspectAccount.proxy?.enabled ? `${inspectAccount.proxy.type.toUpperCase()}:${inspectAccount.proxy.host}` : 'اتصال مباشر'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setInspectAccount(null)}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={handleSaveWorkspace}
                disabled={workspaceSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                {workspaceSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ في قاعدة البيانات المعزولة...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>حفظ كافة تفضيلات الحساب المعزول</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 1. Add Account Modal (Phone -> Code -> 2FA) */}
      {/* ========================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-zinc-100 relative">
            
            {/* Header */}
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-100">إضافة حساب تليجرام جديد (Session Isolation)</h3>
                  <p className="text-xs text-zinc-400">إنشاء جلسة MTProto مستقلة بملف وإعدادات معزولة تماماً</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Progress Steps */}
              <div className="flex items-center justify-between px-2 pb-3 border-b border-zinc-800/80 text-xs">
                <span className={`font-bold ${addStep === 'phone' ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  1. رقم الهاتف
                </span>
                <span className="text-zinc-600">←</span>
                <span className={`font-bold ${addStep === 'code' ? 'text-sky-400' : 'text-zinc-400'}`}>
                  2. كود التحقق
                </span>
                <span className="text-zinc-600">←</span>
                <span className={`font-bold ${addStep === '2fa' ? 'text-purple-400' : 'text-zinc-400'}`}>
                  3. التحقق 2FA (إذا وُجد)
                </span>
              </div>

              {wizardError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* STEP 1: Phone */}
              {addStep === 'phone' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">رقم الهاتف (مع مفتاح الدولة الدولي):</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+966501234567"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">اسم الجلسة الفريد (Session Identifier):</label>
                    <input
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="account_2"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-emerald-500 dir-ltr text-right"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      سيتم إنشاء وتخزين قاعدة بيانات وإعدادات مستقلة كلياً لهذا الحساب لمنع أي تداخل.
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSendCode}
                      disabled={wizardLoading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                    >
                      {wizardLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري طلب الكود من خوادم تليجرام (auth.sendCode)...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>إرسال كود التحقق الآن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Code */}
              {addStep === 'code' && (
                <div className="space-y-4">
                  <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl text-sky-400 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>تم إرسال كود التحقق إلى تطبيق Telegram على الرقم {newPhone}. يرجى نسخه وإدخاله أدناه.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">كود التحقق (Login Code):</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="12345"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest text-zinc-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <input
                      type="checkbox"
                      id="has2fa_check"
                      checked={has2FaOverride}
                      onChange={(e) => setHas2FaOverride(e.target.checked)}
                      className="rounded bg-zinc-950 border-zinc-800 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="has2fa_check" className="cursor-pointer">
                      هذا الحساب يحتوي على كلمة مرور سحابية (2FA Password) مفعلة
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setAddStep('phone')}
                      className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      تغيير الرقم
                    </button>
                    <button
                      onClick={handleSignInWithCode}
                      disabled={wizardLoading}
                      className="w-2/3 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-950/40"
                    >
                      {wizardLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري التحقق (auth.signIn)...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>توثيق وتسجيل الدخول المعزول</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: 2FA Password */}
              {addStep === '2fa' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-300 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-purple-400" />
                    <span>تم رصد SessionPasswordNeededError! الحساب محمي بالتحقق بخطوتين. يرجى إدخال كلمة المرور السحابية.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">كلمة مرور التحقق بخطوتين (2FA Cloud Password):</label>
                    <input
                      type="password"
                      value={new2faPassword}
                      onChange={(e) => setNew2faPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[11px] text-zinc-500 mt-1 block">
                      يقوم النظام بحساب برهان SRP مشفر (account.getPassword) وإرساله بأمان لخوادم Telegram.
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setAddStep('code')}
                      className="w-1/3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      الرجوع للكود
                    </button>
                    <button
                      onClick={handleVerify2FA}
                      disabled={wizardLoading}
                      className="w-2/3 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/40"
                    >
                      {wizardLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري التحقق وحساب برهان SRP...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>تأكيد 2FA وحفظ الجلسة</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Success */}
              {addStep === 'success' && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-lg text-zinc-100">تم تسجيل الحساب وربط الجلسة المعزولة بنجاح!</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    تم إنشاء ملف جلسة وقاعدة بيانات مستقلة لحسابك ({newPhone})، وأصبح جاهزاً للعمل المتزامن واستقبال وإرسال الرسائل.
                  </p>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl mt-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                  >
                    إغلاق والعودة لقائمة الحسابات
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 2. Concurrency Broadcast Modal */}
      {/* ========================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl text-zinc-100 relative">
            
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-100">الإرسال المتزامن لجميع الحسابات (Promise.allSettled)</h3>
                  <p className="text-xs text-zinc-400">إرسال متوازي من كافة الجلسات النشطة مع عزل الأخطاء</p>
                </div>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">نص الرسالة المراد بثها من جميع الحسابات:</label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-sky-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">وجهة الإرسال:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('saved_messages')}
                    className={`p-3 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                      broadcastTarget === 'saved_messages'
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="block font-bold">📌 الرسائل المحفوظة (Saved Messages / me)</span>
                    <span className="text-[11px] text-zinc-500 font-normal">اختبار آمن بدون إزعاج أي مجموعات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('groups')}
                    className={`p-3 rounded-xl border text-xs font-bold text-right transition-all cursor-pointer ${
                      broadcastTarget === 'groups'
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span className="block font-bold">📢 مجموعات وقنوات الإرسال المحددة</span>
                    <span className="text-[11px] text-zinc-500 font-normal">التوزيع على قروبات وقنوات التيليجرام</span>
                  </button>
                </div>
              </div>

              {/* Participating Accounts Preview */}
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80">
                <span className="text-xs text-zinc-400 font-semibold block mb-2">
                  الحسابات المتزامنة المشاركة ({connectedAccounts} حسابات متصلة):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {accounts
                    .filter((a) => a.status === 'connected')
                    .map((a) => (
                      <span key={a.id} className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200">
                        {a.first_name || a.phone}
                      </span>
                    ))}
                </div>
              </div>

              {/* Live Results if executed */}
              {broadcastResults && (
                <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                  <span className="text-xs font-bold text-zinc-300 block">نتائج التنفيذ الفوري:</span>
                  {broadcastResults.map((res, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        res.status === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : res.status === 'flood_wait'
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <span className="font-semibold">{res.session_name} ({res.phone})</span>
                      <span>{res.status === 'success' ? '✅ تم بنجاح' : res.error || 'فشل'}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleRunBroadcast}
                  disabled={broadcasting || connectedAccounts === 0}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-950/40"
                >
                  {broadcasting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري البث المتزامن لجميع الحسابات بالتوازي...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>بدء الإرسال المتزامن الفوري (Run asyncio.gather)</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 3. Proxy Configuration Modal */}
      {/* ========================================= */}
      {showProxyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-zinc-100 relative">
            
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-100">إعدادات البروكسي (IP Isolation)</h3>
                  <p className="text-xs text-zinc-400">لحساب: {showProxyModal.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProxyModal(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <span className="text-xs font-bold text-zinc-200">تفعيل البروكسي لهذا الحساب:</span>
                <input
                  type="checkbox"
                  checked={proxyConfig.enabled}
                  onChange={(e) => setProxyConfig({ ...proxyConfig, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              {proxyConfig.enabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">نوع البروكسي:</label>
                    <select
                      value={proxyConfig.type}
                      onChange={(e) => setProxyConfig({ ...proxyConfig, type: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value="socks5">SOCKS5 (موصى به لـ MTProto)</option>
                      <option value="http">HTTP / HTTPS</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-zinc-300 mb-1">الخادم (Host / IP):</label>
                      <input
                        type="text"
                        value={proxyConfig.host}
                        onChange={(e) => setProxyConfig({ ...proxyConfig, host: e.target.value })}
                        placeholder="104.244.72.115"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 dir-ltr text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">المنفذ (Port):</label>
                      <input
                        type="number"
                        value={proxyConfig.port}
                        onChange={(e) => setProxyConfig({ ...proxyConfig, port: parseInt(e.target.value) || 1080 })}
                        placeholder="1080"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 dir-ltr text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">اسم المستخدم (اختياري):</label>
                      <input
                        type="text"
                        value={proxyConfig.username || ''}
                        onChange={(e) => setProxyConfig({ ...proxyConfig, username: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1">كلمة المرور (اختياري):</label>
                      <input
                        type="password"
                        value={proxyConfig.password || ''}
                        onChange={(e) => setProxyConfig({ ...proxyConfig, password: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleSaveProxy}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-950/40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ إعدادات البروكسي</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 4. Delete Account Options Modal */}
      {/* ========================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-zinc-100 relative">
            
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-100">خيارات حذف وإلغاء الجلسة</h3>
                  <p className="text-xs text-zinc-400">لحساب: {showDeleteModal.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                <h4 className="text-xs font-bold text-zinc-200">الخيار 1: إزالة الجلسة محلياً فقط (موصى به)</h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  يقوم بإنهاء الجلسة من المنظومة وحذف ملف ({showDeleteModal.session_name}.session) دون المساس بحساب تليجرام الفعلي.
                </p>
                <button
                  onClick={() => handleDeleteAccount(false)}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  إزالة الجلسة من البرنامج فقط
                </button>
              </div>

              <div className="p-3.5 bg-rose-500/10 rounded-2xl border border-rose-500/20 space-y-2">
                <h4 className="text-xs font-bold text-rose-300">الخيار 2: حذف حساب Telegram نهائياً (account.deleteAccount)</h4>
                <p className="text-[11px] text-rose-400 leading-relaxed">
                  تحذير: سيقوم باستدعاء أمر حذف الحساب الرسمي من خوادم Telegram وإلغاء تسجيل الرقم ومجموعاته ومحادثاته نهائياً.
                </p>
                <button
                  onClick={() => handleDeleteAccount(true)}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  حذف الحساب نهائياً من تليجرام
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* 5. Anti-Conflict Architecture Modal */}
      {/* ========================================= */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl text-zinc-100 relative max-h-[90vh] flex flex-col">
            
            <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-100">دليل عزل الجلسات وحماية الحسابات من الحظر والتعارض</h3>
                  <p className="text-xs text-zinc-400">القواعد الأربعة الصارمة لإدارة الحسابات المتعددة في تليجرام</p>
                </div>
              </div>
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs leading-relaxed">
              
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>1. عزل ملفات الجلسات والبيانات (Data & Session Isolation)</span>
                </h4>
                <p className="text-zinc-400">
                  يتم حفظ جلسة كل رقم في ملف <code>.session</code> منفصل وتخزين إعداداته، قواعد رده التلقائي، وقنواته في كيان معزول تماماً في قاعدة البيانات لمنع أي تداخل بين الحسابات.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-sky-400 text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>2. تجنب حظر IP والحدود الزمنية (Proxy & Rate Limiting)</span>
                </h4>
                <p className="text-zinc-400">
                  عند تشغيل أكثر من 3 حسابات من نفس عنوان الـ IP، قد تفرض خوادم Telegram خطأ <strong>FloodWaitError</strong> أو تحظر الـ IP مؤقتاً. 
                  لذا يدعم النظام تعيين بروكسي SOCKS5 مستقل لكل حساب لعزله شبكياً.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-purple-400 text-sm flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>3. معالجة التحقق بخطوتين عبر برهان SRP (2FA Security)</span>
                </h4>
                <p className="text-zinc-400">
                  إذا كان الحساب محمياً بكلمة مرور سحابية، فإن استدعاء <code>auth.signIn</code> يُرجع <strong>SESSION_PASSWORD_NEEDED</strong>. 
                  يقوم النظام بحساب برهان SRP مشفر بأمان دون إرسال كلمة المرور بنص صريح.
                </p>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-1.5">
                <h4 className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  <span>4. الإرسال المتزامن واحتواء الأخطاء (Concurrency & Error Isolation)</span>
                </h4>
                <p className="text-zinc-400">
                  يتم تشغيل العمليات عبر <code>Promise.allSettled</code> (المعادل لـ <code>asyncio.gather</code>)، بحيث يتم لف كل استدعاء بـ try/catch مستقل. إذا واجه حساب خطأ FloodWait، يتم عزله مؤقتاً دون إيقاف باقي الحسابات العاملة.
                </p>
              </div>

            </div>

            <div className="p-4 bg-zinc-950 border-t border-zinc-800 text-right shrink-0">
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
