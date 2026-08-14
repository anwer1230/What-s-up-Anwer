import React from 'react';
import {
  Send,
  Mail,
  Zap,
  Bookmark,
  Bot,
  Repeat,
  Brain,
  BarChart3,
  FileText,
  Compass,
  Search,
  Users2
} from 'lucide-react';

export type TabType =
  | 'send_monitor'
  | 'batches'
  | 'accounts'
  | 'link_scraper'
  | 'autojoin'
  | 'links'
  | 'autoreply'
  | 'rotating'
  | 'learning'
  | 'academic'
  | 'formatter';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isLoggedIn?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, isLoggedIn = false }) => {
  const allNavItems: { id: TabType; label: string; icon: React.ReactNode; badge?: string; requiresLogin?: boolean }[] = [
    { id: 'accounts', label: 'إدارة الحسابات', icon: <Users2 className="w-4 h-4 text-emerald-400" />, badge: 'متعدد', requiresLogin: true },
    { id: 'send_monitor', label: 'المراقبة والإرسال', icon: <Send className="w-4 h-4" /> },
    { id: 'batches', label: 'رسائلي', icon: <Mail className="w-4 h-4" /> },
    { id: 'link_scraper', label: 'استخراج وفحص الروابط', icon: <Search className="w-4 h-4 text-sky-400" />, badge: 'جديد 🔍' },
    { id: 'autojoin', label: 'الانضمام التلقائي', icon: <Zap className="w-4 h-4" />, badge: 'سريع' },
    { id: 'links', label: 'روابطي المحفوظة', icon: <Bookmark className="w-4 h-4" /> },
    { id: 'autoreply', label: 'الرد التلقائي', icon: <Bot className="w-4 h-4" /> },
    { id: 'rotating', label: 'الإرسال المتسلسل', icon: <Repeat className="w-4 h-4" /> },
    { id: 'learning', label: 'التعلم الذكي', icon: <Brain className="w-4 h-4" />, badge: 'AI' },
    { id: 'academic', label: 'التحليل الأكاديمي', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'formatter', label: 'منسق المستندات', icon: <FileText className="w-4 h-4" /> }
  ];

  const navItems = allNavItems.filter((item) => !item.requiresLogin || isLoggedIn);

  return (
    <nav className="bg-zinc-900/90 border-b border-zinc-800/80 sticky top-0 z-40 backdrop-blur-xl shadow-xl">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-500/50'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-md font-black transition-colors ${
                      isActive ? 'bg-zinc-950/40 text-emerald-200 border border-white/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
