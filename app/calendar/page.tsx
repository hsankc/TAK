'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ExternalLink, Clock, Target, Sparkles, RefreshCw } from 'lucide-react';

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllEvents();
  }, []);

  async function fetchAllEvents() {
    setLoading(true);
    try {
      // 1. Supabase etkinlikleri (opportunities + todos)
      const { data: opps } = await supabase
        .from('opportunities')
        .select('id, title, deadline, url, category')
        .not('deadline', 'is', null)
        .order('deadline', { ascending: true });

      const { data: todoData } = await supabase
        .from('todos')
        .select('id, title, due_date, priority, completed')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true });

      // 2. Google Calendar etkinlikleri  
      let googleEvents: any[] = [];
      try {
        const res = await fetch('/api/calendar');
        const data = await res.json();
        if (data.success) {
          googleEvents = data.events.map((e: any) => ({
            ...e,
            date: new Date(e.start),
            type: 'google' as const,
          }));
        }
      } catch (err) {
        console.error('Google Calendar fetch error:', err);
      }

      const allEvents = [
        ...(opps || []).map(o => ({
          ...o,
          type: 'opportunity' as const,
          date: new Date(o.deadline)
        })),
        ...(todoData || []).map(t => ({
          ...t,
          type: 'todo' as const,
          date: new Date(t.due_date)
        })),
        ...googleEvents
      ].sort((a, b) => a.date.getTime() - b.date.getTime());

      setEvents(allEvents);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = events.filter(event => {
    const today = startOfDay(new Date());
    if (filter === 'upcoming') return isAfter(event.date, today) || format(event.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    if (filter === 'past') return isBefore(event.date, today);
    return true;
  }).sort((a, b) => {
    if (filter === 'upcoming') return a.date.getTime() - b.date.getTime();
    return b.date.getTime() - a.date.getTime(); // newest first for past & all
  });

  const filters = [
    { value: 'upcoming', label: 'YAKLAŞAN', gradient: 'from-cyan-500 to-blue-600' },
    { value: 'all', label: 'TÜMÜ', gradient: 'from-blue-500 to-indigo-600' },
    { value: 'past', label: 'GEÇMİŞ', gradient: 'from-gray-500 to-gray-600' }
  ];

  const typeConfig: Record<string, { color: string; border: string; label: string; icon: string }> = {
    opportunity: { color: 'text-cyan-400', border: 'border-cyan-500/30 bg-cyan-500/5', label: '🎯 Fırsat', icon: '🎯' },
    todo: { color: 'text-emerald-400', border: 'border-emerald-500/30 bg-emerald-500/5', label: '✅ Hedef', icon: '✅' },
    google: { color: 'text-blue-400', border: 'border-blue-500/30 bg-blue-500/5', label: '📅 Google', icon: '📅' }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <CalendarIcon className="text-blue-500 w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.4em] text-blue-500 uppercase">Timeline Node · Google Calendar Synced</span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black bg-gradient-to-r from-white via-white/80 to-white/20 bg-clip-text text-transparent tracking-tighter">
              Takvim
            </h1>
          </motion.div>

          <div className="flex gap-3 items-center">
            <button
              onClick={fetchAllEvents}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
              title="Yenile"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {filters.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-6 py-2 rounded-xl font-bold text-[10px] whitespace-nowrap transition-all duration-300 border ${filter === f.value ? `bg-gradient-to-r ${f.gradient} border-transparent text-white shadow-lg` : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-blue-500/50">
            <div className="w-10 h-10 border-4 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-bold tracking-widest uppercase">Etkinlikler Yükleniyor...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 text-gray-600">
            <CalendarIcon size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium uppercase tracking-widest">Bu filtrede etkinlik yok</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event, idx) => {
              const config = typeConfig[event.type] || typeConfig.google;
              const hasTime = event.date.getHours() !== 0 || event.date.getMinutes() !== 0;
              return (
                <motion.div
                  key={`${event.type}-${event.id}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`group flex items-center gap-4 p-5 rounded-2xl border-l-4 ${config.border} hover:bg-white/[0.03] transition-all duration-300`}
                >
                  <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${config.color}`}>
                    <Clock size={16} />
                  </div>

                  <div className="flex-1">
                    <p className="font-bold text-white group-hover:text-cyan-300 transition-colors">{event.title}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">
                        {format(event.date, 'dd MMMM yyyy - EEEE', { locale: tr })}
                        {hasTime && ` · ${format(event.date, 'HH:mm')}`}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${config.color}`}>
                        {config.label}
                      </span>
                      {event.category && (
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                          {event.category}
                        </span>
                      )}
                      {event.location && (
                        <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                          📍 {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {event.url && (
                    <a href={event.url} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
                      <ExternalLink size={16} />
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
