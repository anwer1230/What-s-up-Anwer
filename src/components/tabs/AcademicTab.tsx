import React, { useState } from 'react';
import { BarChart3, Upload, FileText, Calculator, Sparkles, Download, CheckCircle2 } from 'lucide-react';
import { AcademicAnalysisResult } from '../../types';

interface AcademicTabProps {
  onAnalyze: (textOrNumbers: string) => Promise<AcademicAnalysisResult>;
}

export const AcademicTab: React.FC<AcademicTabProps> = ({ onAnalyze }) => {
  const [inputData, setInputData] = useState(
    '85, 92, 78, 90, 88, 95, 82, 88, 91, 79, 84, 88, 93, 87, 90, 86, 89, 94'
  );
  const [result, setResult] = useState<AcademicAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = async () => {
    if (!inputData) return;
    setIsAnalyzing(true);
    const res = await onAnalyze(inputData);
    setResult(res);
    setIsAnalyzing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInputData(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">📊 نظام التحليل الإحصائي والأكاديمي الشامل</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              أدخل قيم البيانات أو النصوص الأكاديمية لحساب كافة المؤشرات الإحصائية (المتوسط، الانحراف، الربيعيات، التفرطح) وتوليد الرسومات البيانية.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Inputs & File Upload */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400" />
            إدخال البيانات الإحصائية أو النص
          </h3>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              البيانات الرقمية (مفصولة بفاصلة) أو النص الأكاديمي:
            </label>
            <textarea
              rows={8}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="مثال: 85, 90, 78, 92..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono leading-relaxed"
            />
          </div>

          <label className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300">رفع ملف نصي أو CSV</span>
            <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isAnalyzing ? 'جارِ معالجة التحليل...' : 'تشغيل التحليل الإحصائي 🚀'}
          </button>
        </div>

        {/* Right 2 Columns: Results Metrics & Charts */}
        <div className="lg:col-span-2 space-y-5">
          {result ? (
            <>
              {/* 15 Metrics Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-200">
                  📈 نتائج كافة المؤشرات الإحصائية الـ 15 (Statistical Metrics)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(result.stats).map(([k, v]) => (
                    <div key={k} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block">{k}</span>
                      <span className="text-base font-black text-blue-400 font-mono mt-0.5 block">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Visualization SVG Bar Chart */}
              {result.histogram_bars && result.histogram_bars.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
                  <h3 className="text-sm font-bold text-slate-200">📊 الرسم البياني لتوزيع التكرارات</h3>
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                    <div className="flex items-end justify-between h-36 gap-2 pt-4 px-2">
                      {result.histogram_bars.map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[9px] font-mono text-slate-400 group-hover:text-blue-300">
                            {bar.value}
                          </span>
                          <div
                            className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-md transition-all duration-300"
                            style={{ height: `${Math.max(10, bar.height)}%` }}
                          />
                          <span className="text-[8px] font-mono text-slate-500 truncate w-full text-center">
                            {bar.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Key Insights */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  الملخص والتفسير الأكاديمي الذكي:
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {result.summary}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <BarChart3 className="w-12 h-12 text-slate-700 mx-auto" />
              <h4 className="text-sm font-bold text-slate-300">لم يتم إشعال التحليل الإحصائي بعد</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                قم بالنقر على "تشغيل التحليل الإحصائي" لحساب القيم التفصيلية وعرض التوزيع البياني الذكي.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
