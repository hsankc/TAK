'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  TrendingUp, BookOpen, Target, Calendar,
  Timer, UtensilsCrossed, Zap, Clock, ChevronRight
} from 'lucide-react';

// Nav modules
const MODULES = [
  {
    href: '/opportunities',
    label: 'Fırsatlar',
    desc: 'Staj, hackathon, eğitim',
    icon: TrendingUp,
    gradient: 'from-violet-600 via-purple-600 to-pink-600',
    glow: 'rgba(168,85,247,0.4)',
    particle: '⚡',
  },
  {
    href: '/schedule',
    label: 'Ders Programı',
    desc: 'Takvim & devamsızlık',
    icon: BookOpen,
    gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
    glow: 'rgba(6,182,212,0.4)',
    particle: '📚',
  },
  {
    href: '/todos',
    label: 'Hedefler',
    desc: 'Görev & yapılacaklar',
    icon: Target,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    glow: 'rgba(16,185,129,0.4)',
    particle: '🎯',
  },
  {
    href: '/pomodoro',
    label: 'Pomodoro',
    desc: 'Odaklanma modu',
    icon: Timer,
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    glow: 'rgba(249,115,22,0.4)',
    particle: '🍅',
  },
  {
    href: '/calendar',
    label: 'Takvim',
    desc: 'Etkinlik & son tarihler',
    icon: Calendar,
    gradient: 'from-rose-500 via-pink-600 to-fuchsia-600',
    glow: 'rgba(244,63,94,0.4)',
    particle: '📅',
  },
  {
    href: '/yemek',
    label: 'Yemekhane',
    desc: "Bugünün menüsü",
    icon: UtensilsCrossed,
    gradient: 'from-lime-500 via-green-600 to-emerald-700',
    glow: 'rgba(132,204,22,0.35)',
    particle: '🍽️',
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { text: 'Gece geç saatte', emoji: '🌙' };
  if (h < 12) return { text: 'Günaydın', emoji: '☀️' };
  if (h < 17) return { text: 'İyi günler', emoji: '🌤️' };
  if (h < 21) return { text: 'İyi akşamlar', emoji: '🌆' };
  return { text: 'İyi geceler', emoji: '🌙' };
}

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, applied: 0, todos: 0, deadlines: 0 });
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [urgentDeadlines, setUrgentDeadlines] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const greeting = getGreeting();

  useEffect(() => {
    Promise.all([
      supabase.from('opportunities').select('status, deadline').then(({ data }) => {
        const opps = data || [];
        const today = new Date();
        const in3days = new Date(today.getTime() + 3 * 86400000);
        setStats(s => ({
          ...s,
          total: opps.length,
          applied: opps.filter(o => o.status === 'applied').length,
          deadlines: opps.filter(o => o.deadline && new Date(o.deadline) <= in3days && new Date(o.deadline) >= today).length,
        }));
        const urgent = opps.filter((o: any) => o.deadline && new Date(o.deadline) <= in3days && new Date(o.deadline) >= today);
        setUrgentDeadlines(urgent as any[]);
      }),
      supabase.from('todos').select('completed').then(({ data }) => {
        setStats(s => ({ ...s, todos: (data || []).filter((t: any) => !t.completed).length }));
      }),
      supabase.from('schedule').select('*').eq('day_of_week', new Date().getDay()).order('start_time').then(({ data }) => {
        setTodayClasses(data || []);
      }),
    ]).finally(() => setLoaded(true));
  }, []);

  // Fetch urgent deadlines with titles
  useEffect(() => {
    const today = new Date();
    const in3days = new Date(today.getTime() + 3 * 86400000);
    supabase.from('opportunities').select('id,title,deadline')
      .not('deadline', 'is', null)
      .gte('deadline', today.toISOString())
      .lte('deadline', in3days.toISOString())
      .order('deadline', { ascending: true })
      .limit(3)
      .then(({ data }) => setUrgentDeadlines(data || []));
  }, []);

  const XP_STATS = [
    { label: 'Fırsat', value: stats.total, icon: Zap, color: 'text-violet-400' },
    { label: 'Başvuru', value: stats.applied, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Görev', value: stats.todos, icon: Target, color: 'text-amber-400' },
    { label: 'Alarm', value: stats.deadlines, icon: Clock, color: 'text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white relative overflow-hidden">

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-violet-600/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-pink-500/8 rounded-full blur-[100px] animate-pulse delay-500" />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 py-8 md:py-14 pb-16">

        {/* ── HERO ── */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-10"
        >
          <p className="text-xs text-gray-500 font-mono tracking-[0.3em] uppercase mb-2">
            {greeting.emoji} {greeting.text}
          </p>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-3">
            <span className="bg-gradient-to-r from-white via-white/90 to-white/30 bg-clip-text text-transparent">Tak</span>
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">_</span>
          </h1>
          <p className="text-gray-500 text-sm font-light max-w-xs">
            Kişisel kontrol merkezin. Hedeflerine odaklan.
          </p>
        </motion.div>

        {/* ── XP STAT BAR ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-10 flex-wrap"
        >
          {XP_STATS.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/8 backdrop-blur-sm"
            >
              <Icon size={13} className={color} />
              <span className="text-white font-bold text-sm">{String(value).padStart(2, '0')}</span>
              <span className="text-gray-500 text-xs">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── URGENT DEADLINE ALERT ── */}
        {urgentDeadlines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8 p-4 rounded-2xl bg-red-500/8 border border-red-500/20 flex items-start gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={14} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-1">⚠️ 3 Gün İçinde Biten</p>
              <div className="space-y-1">
                {urgentDeadlines.map(d => {
                  const days = Math.max(0, Math.ceil((new Date(d.deadline).getTime() - Date.now()) / 86400000));
                  return (
                    <div key={d.id} className="flex items-center justify-between gap-2">
                      <span className="text-white text-xs font-medium truncate">{d.title}</span>
                      <span className="text-red-400 text-[10px] font-bold shrink-0">{days === 0 ? 'BUGÜN' : `${days}G`}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <Link href="/opportunities" className="shrink-0 text-red-400 hover:text-red-300">
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        )}

        {/* ── TODAY'S CLASSES (compact) ── */}
        {todayClasses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-8 p-4 rounded-2xl bg-blue-500/8 border border-blue-500/20 flex items-start gap-3"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen size={14} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">📖 Bugünkü Dersler</p>
              <div className="flex flex-wrap gap-2">
                {todayClasses.map(c => (
                  <span key={c.id} className="text-[11px] font-semibold text-white bg-white/8 border border-white/10 px-2.5 py-1 rounded-full">
                    {c.start_time.slice(0, 5)} {c.subject}
                  </span>
                ))}
              </div>
            </div>
            <Link href="/schedule" className="shrink-0 text-blue-400 hover:text-blue-300">
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        )}

        {/* ── MODULE GRID ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-gray-600 font-bold uppercase tracking-[0.3em] mb-5">Modüller</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {MODULES.map((mod, i) => (
              <motion.div
                key={mod.href}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + i * 0.07, type: 'spring', stiffness: 150 }}
                whileHover={{ y: -6, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link href={mod.href} className="block group relative">
                  {/* Glow */}
                  <div
                    className="absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                    style={{ background: mod.glow }}
                  />

                  <div className="relative rounded-3xl bg-gray-950/60 border border-white/8 backdrop-blur-xl overflow-hidden p-5 flex flex-col gap-4 min-h-[140px] group-hover:border-white/20 transition-all duration-300">
                    {/* Gradient top strip */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${mod.gradient}`} />

                    {/* Icon */}
                    <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-lg`}>
                      <mod.icon size={22} className="text-white" />
                    </div>

                    {/* Text */}
                    <div>
                      <p className="font-bold text-white text-sm leading-tight">{mod.label}</p>
                      <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-1">{mod.desc}</p>
                    </div>

                    {/* Particle emoji (decorative, top right) */}
                    <span className="absolute top-4 right-4 text-xl opacity-10 group-hover:opacity-25 transition-opacity select-none">
                      {mod.particle}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── FOOTER TAGLINE ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-gray-700 text-[10px] font-mono tracking-widest mt-14 uppercase"
        >
          TAK v2.0 · 2026
        </motion.p>
      </div>
    </div>
  );
}
