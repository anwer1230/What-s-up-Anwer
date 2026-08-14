import React, { useState } from 'react';
import { Mail, Edit3, Trash2, CheckCircle2, Clock, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { SentBatch } from '../../types';

interface BatchesTabProps {
  batches: SentBatch[];
  onEditBatch: (batchId: string, newText: string) => Promise<void>;
  onDeleteBatch: (batchId: string) => Promise<void>;
  onRefresh: () => void;
}

export const BatchesTab: React.FC<BatchesTabProps> = ({
  batches,
  onEditBatch,
  onDeleteBatch,
  onRefresh
}) => {
  const [selectedBatch, setSelectedBatch] = useState<SentBatch | null>(null);
  const [editText, setEditText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const openEditModal = (batch: SentBatch) => {
    setSelectedBatch(batch);
    setEditText(batch.text);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedBatch) return;
    await onEditBatch(selectedBatch.id, editText);
    setIsEditing(false);
    setSelectedBatch(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">📨 رسائلي — سجل الدفعات المرسلة عبر تليجرام</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              استعرض جميع الدفعات المرسلة مع إمكانية التعديل الجماعي الفوري أو الاسترداد والحذف التلقائي من القنوات والمحادثات.
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all shrink-0"
        >
          تحديث السجل
        </button>
      </div>

      {/* Batches Table / Cards */}
      {batches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">لا توجد دفعات رسائل مرسلة بعد</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            قم بإرسال رسالة من تبويب "المراقبة والإرسال" للبدء بتتبع سجل الدفعات وتعديلها أو حذفها في أي وقت.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">معرف الدفعة</th>
                  <th className="p-4">نص الرسالة</th>
                  <th className="p-4">تاريخ الإرسال</th>
                  <th className="p-4">المجموعات/الأرقام</th>
                  <th className="p-4 text-center">المرفقات</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      #{batch.id.slice(-8)}
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-200 leading-relaxed font-sans">{batch.text || '—'}</p>
                      {batch.edited_at && (
                        <span className="text-[10px] text-amber-400/90 block mt-1 font-mono">
                          (تم التعديل: {batch.edited_at.slice(11, 16)})
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{batch.sent_at}</span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {batch.group_count || batch.sent_count} مستهدف
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {batch.has_media ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                          <ImageIcon className="w-3.5 h-3.5" /> مرفق صور
                        </span>
                      ) : (
                        <span className="text-slate-600">نصي فقط</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(batch)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg border border-blue-500/30 transition-all font-bold text-[11px]"
                          title="تعديل الرسالة في تليجرام"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          تعديل
                        </button>
                        <button
                          onClick={() => onDeleteBatch(batch.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 transition-all font-bold text-[11px]"
                          title="حذف واسترداد الرسائل من المحادثات"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                تعديل الدفعة #{selectedBatch.id.slice(-8)} في محادثات تليجرام
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">النص الجديد للدفعة:</label>
              <textarea
                rows={5}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 font-medium leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-900/40"
              >
                حفظ والتحديث في تليجرام 🚀
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
