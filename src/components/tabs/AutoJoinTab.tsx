import React, { useState } from 'react';
import { Zap, Play, Pause, Square, RotateCcw, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { AutoJoinItem, AutoJoinProgressEvent } from '../../types';

interface AutoJoinTabProps {
  onStartAutoJoin: (data: {
    links: string;
    delay: number;
    max_retries: number;
    fetch_external: boolean;
    search_by_name: boolean;
  }) => Promise<void>;
  onStopAutoJoin: () => Promise<void>;
  onPauseAutoJoin: () => Promise<void>;
  progressEvent: AutoJoinProgressEvent | null;
}

export const AutoJoinTab: React.FC<AutoJoinTabProps> = ({
  onStartAutoJoin,
  onStopAutoJoin,
  onPauseAutoJoin,
  progressEvent
}) => {
  const [linksText, setLinksText] = useState(
    `https://t.me/academic_services_group\nhttps://t.me/university_students_ksa\nhttps://t.me/+AbCdEfGhIjKlMnOp\n@academic_researches_sa\n@graduation_projects_help`
  );
  const [delay, setDelay] = useState(3);
  const [maxRetries, setMaxRetries] = useState(3);
  const [fetchExternal, setFetchExternal] = useState(true);
  const [searchByName, setSearchByName] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleStart = async () => {
    setIsRunning(true);
    setIsPaused(false);
    await onStartAutoJoin({
      links: linksText,
      delay,
      max_retries: maxRetries,
      fetch_external: fetchExternal,
      search_by_name: searchByName
    });
  };

  const handleStop = async () => {
    await onStopAutoJoin();
    setIsRunning(false);
  };

  const handlePauseToggle = async () => {
    await onPauseAutoJoin();
    setIsPaused(!isPaused);
  };

  const counts = progressEvent?.counts || { success: 0, fail: 0, already: 0, done: 0, total: 0 };
  const percent = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Top Banner Notice */}
      <div className="bg-sky-950/50 border border-sky-500/30 rounded-2xl p-5 shadow-xl flex items-start gap-4">
        <div className="p-3 bg-sky-500/20 rounded-2xl text-sky-400 shrink-0 border border-sky-500/30">
          <Zap className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">⚡ الانضمام التلقائي المتقدم لقنوات ومجموعات تليجرام</h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            ضع قائمة الروابط الإلكترونية لمجموعات وقنوات تليجرام (`t.me` أو `telegram.me`) أو معرفات `@username`. سينضم البوت تلقائياً عبر بروتوكول MTProto مع تجاوز المجموعات المكررة.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Input & Controls */}
        <div className="lg:col-span-2 space-y-5">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <label className="block text-sm font-bold text-slate-200">
              📋 روابط ومعرفات القنوات والمجموعات (سطر لكل رابط/معرف)
            </label>
            <textarea
              rows={8}
              value={linksText}
              onChange={(e) => setLinksText(e.target.value)}
              placeholder={`https://t.me/group_name\n@channel_username\nhttps://t.me/+join_hash\nأو الصق مقالاً يحتوي على معرفات تليجرام...`}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-4 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>

          {/* Advanced Switches & Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">التأخير بين الانضمام (ثواني)</label>
              <input
                type="number"
                min="1"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">إعادة المحاولة عند الفشل</label>
              <input
                type="number"
                min="1"
                value={maxRetries}
                onChange={(e) => setMaxRetries(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>

            <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fetchExternal}
                  onChange={(e) => setFetchExternal(e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950"
                />
                جلب الروابط تلقائياً من الصفحات والمواقع الخارجية المذكورة في النص
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchByName}
                  onChange={(e) => setSearchByName(e.target.checked)}
                  className="rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950"
                />
                البحث عن المجموعات بأسمائها إذا لم تكن الروابط المباشرة متوفرة
              </label>
            </div>

          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStart}
              disabled={isRunning && !isPaused}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-900/40 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              بدء الانضمام المتقدم
            </button>

            {isRunning && (
              <>
                <button
                  onClick={handlePauseToggle}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
                >
                  {isPaused ? <Play className="w-4 h-4 fill-slate-950" /> : <Pause className="w-4 h-4 fill-slate-950" />}
                  {isPaused ? 'استئناف' : 'إيقاف مؤقت'}
                </button>

                <button
                  onClick={handleStop}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                >
                  <Square className="w-4 h-4 fill-slate-200" />
                  إيقاف كامل
                </button>
              </>
            )}
          </div>

        </div>

        {/* Right 1 Column: Stats Counter & Live Progress */}
        <div className="space-y-5">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center justify-between">
              <span>📊 تقدم عملية الانضمام</span>
              <span className="text-xs font-mono text-rose-400 font-bold">{counts.done} / {counts.total}</span>
            </h3>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 rounded-full h-4 p-0.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-rose-600 to-amber-500 h-full rounded-full transition-all duration-300 font-mono text-[10px] text-white font-black flex items-center justify-center"
                  style={{ width: `${percent}%` }}
                >
                  {percent > 10 ? `${percent}%` : ''}
                </div>
              </div>
            </div>

            {/* 4 Counter Boxes */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-center">
                <span className="text-xl font-black text-emerald-400 block">{counts.success}</span>
                <span className="text-[11px] font-bold text-emerald-300">✅ تم الانضمام</span>
              </div>

              <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-3 text-center">
                <span className="text-xl font-black text-blue-400 block">{counts.already}</span>
                <span className="text-[11px] font-bold text-blue-300">📌 منضم مسبقاً</span>
              </div>

              <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 text-center">
                <span className="text-xl font-black text-rose-400 block">{counts.fail}</span>
                <span className="text-[11px] font-bold text-rose-300">❌ فشل الانضمام</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                <span className="text-xl font-black text-slate-300 block">{counts.total}</span>
                <span className="text-[11px] font-bold text-slate-400">📋 المجموع الكلي</span>
              </div>
            </div>

          </div>

          {/* Live Progress Item Box */}
          {progressEvent && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
              <span className="text-xs font-bold text-slate-400 block">آخر إجراء:</span>
              <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs space-y-1">
                <p className="font-mono text-emerald-400 font-bold truncate">{progressEvent.url}</p>
                <p className="text-slate-300 font-semibold">{progressEvent.reason}</p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
