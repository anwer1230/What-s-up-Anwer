import React, { useState } from 'react';
import { Terminal, Trash2, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { ActivityLog } from '../types';

interface LiveLogsProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const LiveLogs: React.FC<LiveLogsProps> = ({ logs, onClearLogs }) => {
  const [filterType, setFilterType] = useState<string>('الكل');
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === 'الكل' || log.type === filterType;
    const matchesSearch = log.message.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getLogBadge = (type: ActivityLog['type']) => {
    switch (type) {
      case 'success':
        return <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">نجاح ✅</span>;
      case 'error':
        return <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 text-[10px] font-bold">خطأ ❌</span>;
      case 'warning':
        return <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 text-[10px] font-bold">تنبيه ⚠️</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">معلومات ℹ️</span>;
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      
      {/* Console Bar */}
      <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-zinc-200">سجل العمليات والنشاط المباشر (Live Terminal Logs)</h3>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono font-bold">
            {logs.length} سجلات
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClearLogs}
            className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg text-xs transition-all border border-zinc-700/50"
            title="مسح السجل"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 rounded-lg text-xs transition-all border border-zinc-700/50"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="تصفية السجلات..."
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl pr-8 pl-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {['الكل', 'info', 'success', 'warning', 'error'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    filterType === t 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50' 
                      : 'bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Box */}
          <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 h-48 overflow-y-auto font-mono text-xs space-y-2 scrollbar-thin">
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-500 text-center py-10 font-sans">
                لا توجد سجلات تطابق البحث في الوقت الحالي
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2.5 border-b border-zinc-900/80 pb-1.5">
                  <span className="text-[10px] text-zinc-500 shrink-0 mt-0.5">{log.timestamp}</span>
                  {getLogBadge(log.type)}
                  <span className="text-zinc-200 leading-relaxed font-sans">{log.message}</span>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
};
