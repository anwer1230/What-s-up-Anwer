import React, { useState, useEffect } from 'react';
import { Repeat, Play, Square, Save, Clock, Hourglass } from 'lucide-react';

interface RotatingTabProps {
  status: {
    active: boolean;
    messages: string[];
    groups: string[];
    interval: number;
    next_send_in?: number;
    interval_seconds?: number;
  };
  onSave: (messages: string[], groups: string[], interval: number) => Promise<void>;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
}

export const RotatingTab: React.FC<RotatingTabProps> = ({
  status,
  onSave,
  onStart,
  onStop
}) => {
  const [messages, setMessages] = useState<string[]>(
    status.messages?.length ? status.messages : ['', '', '', '', '']
  );
  const [groups, setGroups] = useState((status.groups || []).join('\n'));
  const [intervalVal, setIntervalVal] = useState(status.interval || 5);
  const [countdown, setCountdown] = useState<number>(status.next_send_in || 0);

  useEffect(() => {
    if (status.messages?.length) {
      const padded = [...status.messages];
      while (padded.length < 5) padded.push('');
      setMessages(padded.slice(0, 5));
    }
    if (status.groups?.length) setGroups(status.groups.join('\n'));
    if (status.interval) setIntervalVal(status.interval);
  }, [status]);

  useEffect(() => {
    if (status.active && status.next_send_in) {
      setCountdown(status.next_send_in);
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status.active, status.next_send_in]);

  const handleMessageChange = (index: number, val: string) => {
    const updated = [...messages];
    updated[index] = val;
    setMessages(updated);
  };

  const handlePresetClick = (minutes: number) => {
    setIntervalVal(minutes);
  };

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveClick = () => {
    onSave(
      messages.filter((m) => m.trim()),
      groups.split('\n').map((g) => g.trim()).filter(Boolean),
      intervalVal
    );
  };

  const totalSec = (intervalVal || 5) * 60;
  const progressPercent = totalSec > 0 ? Math.min(100, Math.round(((totalSec - countdown) / totalSec) * 100)) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">🔄 النشر الدوري المتسلسل عبر تليجرام</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              أرسل حتى 5 رسائل بالتناوب (Round-Robin) إلى قنوات ومجموعات محددة كل عدة دقائق لضمان التنويع ومنع كشف التكرار.
            </p>
          </div>
        </div>

        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs ${
              status.active
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            ● {status.active ? 'النشر المتسلسل نشط ويعمل' : 'متوقف'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Messages & Groups */}
        <div className="lg:col-span-2 space-y-5">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <label className="block text-sm font-bold text-slate-200">
              📝 الرسائل المتسلسلة (حتى 5 رسائل تدور بالتناوب)
            </label>

            {messages.map((msg, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-xs font-semibold text-emerald-400 block">الرسالة رقم {idx + 1}:</span>
                <textarea
                  rows={2}
                  value={msg}
                  onChange={(e) => handleMessageChange(idx, e.target.value)}
                  placeholder={`أدخل النص التسويقي للرسالة ${idx + 1}...`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-medium leading-relaxed"
                />
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <label className="block text-sm font-bold text-slate-200">
              👥 قنوات ومجموعات ومعرفات تليجرام المستهدفة بالنشر الدوري
            </label>
            <textarea
              rows={4}
              value={groups}
              onChange={(e) => setGroups(e.target.value)}
              placeholder={`https://t.me/academic_services_group\n@academic_researches_sa\nhttps://t.me/+join_hash`}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-100 leading-relaxed"
            />
          </div>

        </div>

        {/* Right 1 Column: Interval Presets & Countdown Card */}
        <div className="space-y-5">
          
          {/* Interval Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <label className="block text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              الفترة الزمنية بين الإرسال (بالدقائق)
            </label>

            <input
              type="number"
              min="1"
              value={intervalVal}
              onChange={(e) => setIntervalVal(parseInt(e.target.value) || 1)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-lg font-black text-emerald-400"
            />

            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">اختيار سريع للفاصل:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '30 ثانية', val: 0.5 },
                  { label: 'دقيقة', val: 1 },
                  { label: '5 دقائق', val: 5 },
                  { label: '15 دقيقة', val: 15 },
                  { label: '30 دقيقة', val: 30 },
                  { label: 'ساعة', val: 60 },
                  { label: '3 ساعات', val: 180 }
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => handlePresetClick(preset.val)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-emerald-600/30 text-slate-300 border border-slate-800 rounded-lg text-xs font-bold transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 text-center">
              <span className="text-xs font-bold text-emerald-300">
                سيتم الإرسال كل: <strong className="text-white font-mono">{intervalVal} دقيقة</strong>
              </span>
            </div>
          </div>

          {/* Countdown Display Card */}
          {status.active && (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 shadow-xl text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                <Hourglass className="w-4 h-4 animate-spin" />
                الإرسال القادم خلال:
              </div>
              <div className="text-4xl font-black font-mono text-emerald-300 tracking-wider">
                {formatCountdown(countdown)}
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleSaveClick}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </button>

            <button
              onClick={onStart}
              disabled={status.active}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              بدء النشر الدوري المتسلسل
            </button>

            {status.active && (
              <button
                onClick={onStop}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Square className="w-4 h-4 fill-white" />
                إيقاف النشر المتسلسل
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
