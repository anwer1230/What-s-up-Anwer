import React, { useState } from 'react';
import { FileText, Download, Eye, FileSpreadsheet, Presentation, FileCode2, Sparkles, CheckCircle2 } from 'lucide-react';

interface DocFormatterTabProps {
  onExportDoc: (format: 'docx' | 'xlsx' | 'pptx' | 'pdf', htmlContent: string) => Promise<void>;
}

export const DocFormatterTab: React.FC<DocFormatterTabProps> = ({ onExportDoc }) => {
  const [htmlContent, setHtmlContent] = useState(`
<div style="font-family: 'Segoe UI', sans-serif; text-align: right; direction: rtl; padding: 20px; line-height: 1.8;">
  <h1 style="color: #059669; border-bottom: 2px solid #059669; pb: 10px;">تقرير النشاط الأكاديمي والتنفيذي</h1>
  <p style="color: #374151; font-size: 14px;">تم إعداد هذا التقرير المنظم لتلخيص نتائج الحسابات والإحصاءات الميدانية.</p>

  <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: right;">
    <thead>
      <tr style="background-color: #059669; color: white;">
        <th style="padding: 10px; border: 1px solid #ddd;">المؤشر الإحصائي</th>
        <th style="padding: 10px; border: 1px solid #ddd;">القيمة المحسوبة</th>
        <th style="padding: 10px; border: 1px solid #ddd;">الحالة</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background-color: #f9fafb;">
        <td style="padding: 8px; border: 1px solid #ddd;">إجمالي المستهدفين</td>
        <td style="padding: 8px; border: 1px solid #ddd;">1,250</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: green;">مكتمل ✅</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">معدل النجاح الإجمالي</td>
        <td style="padding: 8px; border: 1px solid #ddd;">98.4%</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: green;">ممتاز 🌟</td>
      </tr>
    </tbody>
  </table>
</div>
  `.trim());

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('preview');
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleExport = async (format: 'docx' | 'xlsx' | 'pptx' | 'pdf') => {
    setDownloadingFormat(format);
    await onExportDoc(format, htmlContent);
    setDownloadingFormat(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">📑 منسق ومحول المستندات الشامل (Word, Excel, PowerPoint)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              قم بتنسيق النصوص والجداول بالـ HTML والمعاينة المباشرة، ثم تصدير الملفات تلقائياً بتنسيقات DOCX, XLSX, PPTX, PDF.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Formatter Controls & Export Buttons */}
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200">🚀 أزرار التصدير والتحويل المباشر</h3>

            <div className="space-y-2.5">
              <button
                onClick={() => handleExport('docx')}
                disabled={!!downloadingFormat}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                تصدير كمستند وورد (DOCX)
              </button>

              <button
                onClick={() => handleExport('xlsx')}
                disabled={!!downloadingFormat}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                تصدير كجدول إكسل (XLSX)
              </button>

              <button
                onClick={() => handleExport('pptx')}
                disabled={!!downloadingFormat}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Presentation className="w-4 h-4" />
                تصدير كعرض باوربوينت (PPTX)
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={!!downloadingFormat}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                تحويل PDF إلى Word / تحميل PDF
              </button>
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Editor & Live Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            
            {/* Header Switch */}
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  المعاينة المباشرة
                </button>
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'editor' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  محرر كود HTML
                </button>
              </div>

              <span className="text-[10px] text-slate-500 font-mono">HTML Formatter Mode</span>
            </div>

            {/* Content Display */}
            <div className="p-4 bg-slate-950">
              {activeTab === 'preview' ? (
                <div
                  className="bg-white text-slate-900 p-6 rounded-xl min-h-[380px] shadow-inner font-sans"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              ) : (
                <textarea
                  rows={16}
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
