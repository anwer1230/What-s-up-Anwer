import React, { useState } from 'react';
import { Brain, Plus, Trash2, Bot, Sparkles, Send, HelpCircle, CheckCircle2 } from 'lucide-react';
import { LearningService, UnknownRequest } from '../../types';

interface LearningTabProps {
  activePrivate: boolean;
  activeGroup: boolean;
  services: Record<string, LearningService>;
  onToggleActive: (type: 'private' | 'group', active: boolean) => Promise<void>;
  onGenerateAiResponse: (text: string, senderName?: string) => Promise<string>;
}

export const LearningTab: React.FC<LearningTabProps> = ({
  activePrivate,
  activeGroup,
  services,
  onToggleActive,
  onGenerateAiResponse
}) => {
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceKeywords, setServiceKeywords] = useState('');
  const [localServices, setLocalServices] = useState(services);
  const [testMsg, setTestMsg] = useState('سلام عليكم كم تسوون بحث 10 صفحات؟');
  const [aiResult, setAiResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !serviceDesc) return;
    setLocalServices((prev) => ({
      ...prev,
      [serviceName]: {
        description: serviceDesc,
        keywords: serviceKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        price_range: 'حسب المطلوب',
        time_range: 'تسليم سريع'
      }
    }));
    setServiceName('');
    setServiceDesc('');
    setServiceKeywords('');
  };

  const handleTestAi = async () => {
    if (!testMsg) return;
    setIsGenerating(true);
    const reply = await onGenerateAiResponse(testMsg, 'أحمد');
    setAiResult(reply);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">🧠 نظام التعلم والرد الذكي لتليجرام (Gemini AI + Telegram)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              بوت خدمي ذكي يتعلم أسلوب الرد باللهجة الخليجية، يتعرف على الخدمات المطلوبة ويزود عملاء وطلاب قنوات ومجموعات تليجرام بالتفاصيل والردود البشرية.
            </p>
          </div>
        </div>
      </div>

      {/* Activation Switches Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200">💬 المحادثات الخاصة (Private Telegram)</h4>
            <span className="text-[10px] text-slate-400">تفعيل البوت للرد التلقائي على الرسائل الفردية</span>
          </div>
          <button
            onClick={() => onToggleActive('private', !activePrivate)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activePrivate ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {activePrivate ? 'مفعل ✅' : 'معطل 🚫'}
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200">👥 المجموعات والقنوات (Telegram Groups & Channels)</h4>
            <span className="text-[10px] text-slate-400">تفعيل البوت للرد التلقائي داخل قنوات ومجموعات تليجرام</span>
          </div>
          <button
            onClick={() => onToggleActive('group', !activeGroup)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeGroup ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {activeGroup ? 'مفعل ✅' : 'معطل 🚫'}
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form & Services List */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Add Service Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-400" />
              إضافة خدمة جديدة لمعرفة البوت الذكي
            </h3>

            <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="اسم الخدمة (مثل: ترجمة)"
                className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              />
              <input
                type="text"
                required
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
                placeholder="وصف الخدمة وشروطها"
                className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white sm:col-span-2"
              />
              <input
                type="text"
                value={serviceKeywords}
                onChange={(e) => setServiceKeywords(e.target.value)}
                placeholder="كلمات مفتاحية مفصولة بفاصلة (ترجمة, نصوص, لغة)"
                className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white sm:col-span-2"
              />
              <button
                type="submit"
                className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                إضافة الخدمة ➕
              </button>
            </form>
          </div>

          {/* Registered Services Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200">
              📚 الخدمات الأكاديمية المسجلة في القاموس ({Object.keys(localServices).length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(localServices).map(([key, serviceVal]) => {
                const srv = serviceVal as LearningService;
                return (
                  <div key={key} className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1">
                    <span className="font-bold text-purple-400 text-xs block">{key}</span>
                    <p className="text-[11px] text-slate-300">{srv.description}</p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(srv.keywords || []).map((kw, i) => (
                        <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Instant Gemini AI Response Tester */}
        <div className="space-y-5">
          
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              اختبار الرد الذكي المباشر (Gemini AI)
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">رسالة واصلة من عميل تليجرام:</label>
              <textarea
                rows={3}
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <button
              onClick={handleTestAi}
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Bot className="w-4 h-4" />
              {isGenerating ? 'جارِ التوليد والتحليل...' : 'توليد رد ذكي كأنك إنسان حقيقي 🚀'}
            </button>

            {aiResult && (
              <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-purple-300 block">الرد المقترح:</span>
                <p className="text-xs text-white font-medium leading-relaxed">{aiResult}</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
