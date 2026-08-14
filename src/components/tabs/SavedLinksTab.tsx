import React, { useState } from 'react';
import { Bookmark, Plus, Trash2, Send, Copy, Download, Search, ExternalLink, Check } from 'lucide-react';
import { SavedLink } from '../../types';

interface SavedLinksTabProps {
  links: SavedLink[];
  categories: string[];
  onAddLink: (data: { url: string; title: string; category: string; notes: string }) => Promise<void>;
  onDeleteLink: (id: string) => Promise<void>;
  onSendToAutoJoin: (ids: string[]) => Promise<void>;
}

export const SavedLinksTab: React.FC<SavedLinksTabProps> = ({
  links,
  categories,
  onAddLink,
  onDeleteLink,
  onSendToAutoJoin
}) => {
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('عام');
  const [notesInput, setNotesInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredLinks = links.filter((link) => {
    const matchesCat = selectedCategory === 'الكل' || link.category === selectedCategory;
    const matchesQuery =
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;
    await onAddLink({
      url: urlInput,
      title: titleInput || urlInput,
      category: categoryInput,
      notes: notesInput
    });
    setUrlInput('');
    setTitleInput('');
    setNotesInput('');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCopySelected = () => {
    const activeList = selectedIds.length
      ? filteredLinks.filter((l) => selectedIds.includes(l.id))
      : filteredLinks;
    const text = activeList.map((l) => l.url).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSelectedToJoin = async () => {
    const idsToSend = selectedIds.length ? selectedIds : filteredLinks.map((l) => l.id);
    await onSendToAutoJoin(idsToSend);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">🔖 روابطي المحفوظة — أرشيف قنوات ومجموعات تليجرام</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              احفظ ونسّق روابط وقنوات تليجرام الهامة مع أزرار التصدير والنسخ المباشر ونقل الروابط فوراً لتبويب الانضمام.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySelected}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'تم النسخ' : 'نسخ الروابط'}
          </button>
          <button
            onClick={handleSendSelectedToJoin}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            إرسال للانضمام التلقائي ⚡
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Add New Link */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            إضافة رابط مجموعة جديد
          </h3>

          <form onSubmit={handleAddSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">الرابط أو المعرف (URL/@) *</label>
              <input
                type="text"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://t.me/academic_group أو @channel_name"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">عنوان المجموعة</label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="مثال: طلاب الحاسب والمعلومات"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">التصنيف</label>
              <select
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
              >
                <option value="عام">عام</option>
                <option value="أكاديمي">أكاديمي</option>
                <option value="تسويق">تسويق</option>
                <option value="دعم">دعم</option>
                <option value="تقني">تقني</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">ملاحظات إضافية</label>
              <textarea
                rows={2}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="أي تفاصيل أو وصف..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              إضافة إلى الأرشيف ➕
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Saved Links Table */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters & Search Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الروابط والمجموعات..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 whitespace-nowrap">التصنيف:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {filteredLinks.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                لا توجد روابط محفوظة ضمن هذا التصنيف
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3.5 text-center">اختيار</th>
                      <th className="p-3.5">العنوان والرابط</th>
                      <th className="p-3.5">التصنيف</th>
                      <th className="p-3.5">الملاحظات</th>
                      <th className="p-3.5 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium">
                    {filteredLinks.map((link) => {
                      const isSelected = selectedIds.includes(link.id);
                      return (
                        <tr key={link.id} className="hover:bg-slate-800/40 transition-all">
                          <td className="p-3.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(link.id)}
                              className="rounded border-slate-700 text-amber-500 bg-slate-950"
                            />
                          </td>
                          <td className="p-3.5">
                            <p className="font-bold text-slate-100">{link.title}</p>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              {link.url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700 text-[10px] font-bold">
                              {link.category}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {link.notes || '—'}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => onDeleteLink(link.id)}
                              className="p-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
