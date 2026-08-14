import React, { useState } from 'react';
import { Bot, Plus, Trash2, Power, CheckCircle, MessageSquare } from 'lucide-react';
import { AutoReplyRule } from '../../types';

interface AutoReplyTabProps {
  enabled: boolean;
  rules: AutoReplyRule[];
  onToggleEnabled: (enabled: boolean) => Promise<void>;
  onAddRule: (rule: { keyword: string; reply: string; scope: 'all' | 'private' | 'groups'; match: 'contains' | 'exact' | 'regex' }) => Promise<void>;
  onDeleteRule: (index: number) => Promise<void>;
}

export const AutoReplyTab: React.FC<AutoReplyTabProps> = ({
  enabled,
  rules,
  onToggleEnabled,
  onAddRule,
  onDeleteRule
}) => {
  const [keyword, setKeyword] = useState('');
  const [reply, setReply] = useState('');
  const [scope, setScope] = useState<'all' | 'private' | 'groups'>('all');
  const [matchMode, setMatchMode] = useState<'contains' | 'exact' | 'regex'>('contains');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword || !reply) return;
    await onAddRule({
      keyword,
      reply,
      scope,
      match: matchMode
    });
    setKeyword('');
    setReply('');
  };

  return (
    <div className="space-y-6">
      
      {/* Master Switch & Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400 border border-cyan-500/30">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">🤖 الردود التلقائية الذكية لتليجرام</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              قم بإنشاء قواعد رد تلقائي مخصصة بحسب الكلمة المفتاحية أو التعبير النمطي، وتخصيص نطاق الرد (المحادثات الفردية أو المجموعات والقنوات).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <span className="text-xs font-bold text-slate-200">تفعيل الرد التلقائي:</span>
          <button
            onClick={() => onToggleEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-1' : 'translate-x-6'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Add Rule */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            إضافة قاعدة رد جديدة
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">الكلمة أو الجملة المفتاحية *</label>
              <input
                type="text"
                required
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="مثال: السلام عليكم أو أسعار"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">نص الرد التلقائي *</label>
              <textarea
                rows={3}
                required
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="مثال: وعليكم السلام ورحمة الله! أهلاً بك..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">نمط المطابقة</label>
                <select
                  value={matchMode}
                  onChange={(e) => setMatchMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
                >
                  <option value="contains">يحتوي على (افتراضي)</option>
                  <option value="exact">مطابقة كاملة</option>
                  <option value="regex">تعبير نمطي (Regex)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">النطاق</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-100"
                >
                  <option value="all">كل المحادثات</option>
                  <option value="private">الخاص فقط</option>
                  <option value="groups">المجموعات فقط</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              إضافة القاعدة ➕
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Rules List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-200">
                📋 القواعد الحالية المسجلة ({rules.length})
              </h3>
            </div>

            {rules.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                لا توجد قواعد رد تلقائي مضافة بعد
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400 text-sm">{rule.keyword}</span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                          {rule.match}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold">
                          {rule.scope === 'all' ? 'جميع المحادثات' : rule.scope === 'private' ? 'الخاص فقط' : 'المجموعات'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{rule.reply}</p>
                      <span className="text-[10px] text-slate-500 block">
                        استُخدمت: {rule.used_count || 0} مرة | آخر استخدام: {rule.last_used || '—'}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteRule(idx)}
                      className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-all self-end sm:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
