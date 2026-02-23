'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, BookOpen, Clock, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ScheduleItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  location?: string;
  color: string;
}

const DAYS = [
  { idx: 1, name: 'Pazartesi', short: 'Pzt' },
  { idx: 2, name: 'Salı', short: 'Sal' },
  { idx: 3, name: 'Çarşamba', short: 'Çar' },
  { idx: 4, name: 'Perşembe', short: 'Per' },
  { idx: 5, name: 'Cuma', short: 'Cum' },
];
const COLORS = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function timeToMin(t: string) { const p = t.split(':'); return +p[0] * 60 + +p[1]; }

// Merge consecutive same-subject entries into blocks
function mergeClasses(items: ScheduleItem[]) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => timeToMin(a.start_time) - timeToMin(b.start_time));
  const merged: { ids: string[]; subject: string; start: string; end: string; location?: string; color: string; duration: number }[] = [];

  let cur = { ids: [sorted[0].id], subject: sorted[0].subject, start: sorted[0].start_time.substring(0, 5), end: sorted[0].end_time.substring(0, 5), location: sorted[0].location, color: sorted[0].color };

  for (let i = 1; i < sorted.length; i++) {
    const s = sorted[i];
    const prevEnd = timeToMin(cur.end);
    const curStart = timeToMin(s.start_time);
    // Merge if same subject and gap <= 15 min
    if (s.subject === cur.subject && curStart - prevEnd <= 15) {
      cur.end = s.end_time.substring(0, 5);
      cur.ids.push(s.id);
    } else {
      merged.push({ ...cur, duration: timeToMin(cur.end) - timeToMin(cur.start) });
      cur = { ids: [s.id], subject: s.subject, start: s.start_time.substring(0, 5), end: s.end_time.substring(0, 5), location: s.location, color: s.color };
    }
  }
  merged.push({ ...cur, duration: timeToMin(cur.end) - timeToMin(cur.start) });
  return merged;
}

export default function SchedulePage() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    day_of_week: 1, start_time: '09:00', end_time: '10:00',
    subject: '', location: '', color: '#3b82f6'
  });

  useEffect(() => { fetchSchedule(); }, []);

  async function fetchSchedule() {
    const { data } = await supabase.from('schedule').select('*').order('start_time');
    setSchedule(data || []);
  }

  const uniqueSubjects = [...new Set(schedule.map(s => s.subject))].sort();
  const uniqueLocations = [...new Set(schedule.map(s => s.location).filter(Boolean))].sort();

  // Drag
  function onDragStart(e: MouseEvent | TouchEvent | PointerEvent | React.DragEvent, ids: string[]) {
    setDraggedItem(ids[0]);
    if ('dataTransfer' in e && e.dataTransfer) {
      (e.dataTransfer as DataTransfer).effectAllowed = 'move';
    }
  }
  function onDragOver(e: React.DragEvent, day: number) { e.preventDefault(); setDragOverDay(day); }
  function onDragLeave() { setDragOverDay(null); }
  async function onDrop(e: React.DragEvent, targetDay: number) {
    e.preventDefault(); setDragOverDay(null);
    if (!draggedItem) return;
    const item = schedule.find(s => s.id === draggedItem);
    if (!item || item.day_of_week === targetDay) { setDraggedItem(null); return; }
    // Move all same-subject same-day items
    const toMove = schedule.filter(s => s.subject === item.subject && s.day_of_week === item.day_of_week);
    for (const s of toMove) {
      await supabase.from('schedule').update({ day_of_week: targetDay }).eq('id', s.id);
    }
    setDraggedItem(null); fetchSchedule();
  }

  function openEdit(item: ScheduleItem) {
    setEditingItem(item);
    setFormData({ day_of_week: item.day_of_week, start_time: item.start_time.substring(0, 5), end_time: item.end_time.substring(0, 5), subject: item.subject, location: item.location || '', color: item.color || '#3b82f6' });
    setShowModal(true);
  }
  function openAdd() {
    setEditingItem(null);
    setFormData({ day_of_week: 1, start_time: '09:00', end_time: '10:00', subject: '', location: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] });
    setShowModal(true);
  }
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (editingItem) await supabase.from('schedule').update(formData).eq('id', editingItem.id);
    else await supabase.from('schedule').insert([formData]);
    setShowModal(false); setEditingItem(null); fetchSchedule();
  }
  async function handleDeleteBlock(ids: string[]) {
    if (!confirm('Bu dersi silmek istediğinize emin misiniz?')) return;
    for (const id of ids) await supabase.from('schedule').delete().eq('id', id);
    fetchSchedule();
  }

  return (
    <div className="min-h-screen bg-[#030712] text-white p-4 md:p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="text-indigo-500 w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.4em] text-indigo-500 uppercase">Academic Core</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black bg-gradient-to-r from-white via-white/80 to-white/20 bg-clip-text text-transparent tracking-tighter">
              Ders Programı
            </h1>
          </motion.div>
          <button onClick={openAdd}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
            <Plus size={14} /> DERS EKLE
          </button>
        </div>

        {/* Schedule Table */}
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <div className="min-w-[700px]">
            {/* Day Headers */}
            <div className="grid grid-cols-5 gap-3 mb-3">
              {DAYS.map(d => (
                <div key={d.idx} className={`text-center py-3 rounded-2xl transition-all ${dragOverDay === d.idx ? 'bg-indigo-500/15 border-2 border-indigo-500/40 border-dashed' : 'bg-white/[0.03] border border-white/5'
                  }`}
                  onDragOver={e => onDragOver(e, d.idx)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, d.idx)}
                >
                  <span className="font-black text-sm text-gray-300 uppercase tracking-widest hidden md:inline">{d.name}</span>
                  <span className="font-black text-sm text-gray-300 uppercase tracking-widest md:hidden">{d.short}</span>
                </div>
              ))}
            </div>

            {/* Class Cards Grid */}
            <div className="grid grid-cols-5 gap-3 items-start">
              {DAYS.map(day => {
                const dayItems = schedule.filter(s => s.day_of_week === day.idx);
                const blocks = mergeClasses(dayItems);
                return (
                  <div key={day.idx} className="space-y-2"
                    onDragOver={e => onDragOver(e, day.idx)} onDragLeave={onDragLeave} onDrop={e => onDrop(e, day.idx)}
                  >
                    {blocks.length === 0 && (
                      <div className="h-24 rounded-2xl border border-dashed border-white/[0.04] flex items-center justify-center">
                        <span className="text-[10px] text-gray-700">—</span>
                      </div>
                    )}
                    {blocks.map((block, idx) => {
                      // Height scales: min 70px, then +20px per 30min over 45min
                      const baseH = 80;
                      const extraH = Math.max(0, block.duration - 45) * 0.5;
                      const h = baseH + extraH;
                      const isDragged = draggedItem && block.ids.includes(draggedItem);

                      const nextBlock = blocks[idx + 1];
                      let gapDuration = 0;
                      if (nextBlock) {
                        gapDuration = timeToMin(nextBlock.start) - timeToMin(block.end);
                      }

                      return (
                        <div key={block.ids[0]} className="space-y-2">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            draggable
                            onDragStart={e => onDragStart(e, block.ids)}
                            className={`rounded-2xl p-3.5 relative group cursor-grab active:cursor-grabbing transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30 hover:z-10 border border-white/[0.06] ${isDragged ? 'opacity-30 scale-95' : ''
                              }`}
                            style={{
                              minHeight: h,
                              background: `linear-gradient(135deg, ${block.color}15 0%, ${block.color}08 100%)`,
                              borderLeft: `3px solid ${block.color}`,
                            }}
                          >
                            {/* Actions */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={e => { e.stopPropagation(); openEdit(schedule.find(s => s.id === block.ids[0])!); }}
                                className="p-1 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-white/10 transition">
                                <Pencil size={11} className="text-white/60" />
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleDeleteBlock(block.ids); }}
                                className="p-1 rounded-lg bg-black/30 backdrop-blur-sm hover:bg-red-500/30 transition">
                                <X size={11} className="text-red-400" />
                              </button>
                            </div>

                            {/* Content */}
                            <div onClick={() => router.push(`/schedule/course/${encodeURIComponent(block.subject)}`)} className="cursor-pointer">
                              <p className="font-bold text-[13px] text-white leading-snug mb-2 pr-10 hover:text-indigo-300 transition-colors">
                                {block.subject}
                              </p>
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Clock size={12} />
                                <span className="text-[11px] font-medium tabular-nums">{block.start} - {block.end}</span>
                              </div>
                              {block.location && (
                                <p className="text-[11px] text-gray-500 mt-1.5">📍 {block.location}</p>
                              )}
                              <div className="mt-2">
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                                  style={{ backgroundColor: block.color + '20', color: block.color }}>
                                  {block.duration} dk
                                </span>
                              </div>
                            </div>
                          </motion.div>

                          {/* Gap Indicator */}
                          {gapDuration > 15 && (
                            <div className="flex items-center justify-center py-1 opacity-60 hover:opacity-100 transition-opacity">
                              <div className="border border-dashed border-white/20 rounded-xl px-3 py-1.5 flex items-center gap-2 text-[10px] font-bold text-gray-400 bg-white/[0.02]">
                                <Clock size={10} className="text-indigo-400" />
                                {gapDuration >= 60 ? `${Math.floor(gapDuration / 60)} sa ${gapDuration % 60} dk` : `${gapDuration} dk`} BOŞLUK
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => { setShowModal(false); setEditingItem(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-black text-white mb-4">{editingItem ? 'Dersi Düzenle' : 'Yeni Ders Ekle'}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gün</label>
                  <select value={formData.day_of_week} onChange={e => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none appearance-none">
                    {DAYS.map(d => (<option key={d.idx} value={d.idx} className="bg-gray-900">{d.name}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Başlangıç</label>
                    <input type="time" value={formData.start_time} onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bitiş</label>
                    <input type="time" value={formData.end_time} onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ders Adı</label>
                  <input type="text" list="subject-list" value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none placeholder:text-gray-600"
                    placeholder="Seç veya yaz..." required />
                  <datalist id="subject-list">{uniqueSubjects.map(s => (<option key={s} value={s} />))}</datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Lokasyon</label>
                  <input type="text" list="location-list" value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none placeholder:text-gray-600"
                    placeholder="Seç veya yaz..." />
                  <datalist id="location-list">{uniqueLocations.map(l => (<option key={l} value={l!} />))}</datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Renk</label>
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setFormData({ ...formData, color: c })}
                        className={`w-8 h-8 rounded-lg transition-all ${formData.color === c ? 'ring-2 ring-white scale-110' : 'opacity-50 hover:opacity-100'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-indigo-500 text-black py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-400 transition">
                    {editingItem ? 'Güncelle' : 'Ekle'}
                  </button>
                  <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }}
                    className="flex-1 bg-white/5 border border-white/10 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition">İptal</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
