'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import AddByUrl from '@/components/AddByUrl';
import Link from 'next/link';
import {
  Calendar,
  Target,
  BookOpen,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Activity,
  Clock,
  ArrowUpRight,
  ExternalLink,
  UtensilsCrossed,
  AlertCircle
} from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    pending: 0,
    todosCount: 0,
    upcomingDeadlines: 0
  });
  const [recentOpps, setRecentOpps] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [todayMeal, setTodayMeal] = useState<any | null>(null);
  const [upcomingOppList, setUpcomingOppList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentOpps(),
        fetchTodayClasses(),
        fetchTodayMeal(),
        fetchUpcomingDeadlines()
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const { data: opps } = await supabase.from('opportunities').select('status, deadline');
      const { data: todos } = await supabase.from('todos').select('completed, due_date');

      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      setStats({
        total: opps?.length || 0,
        applied: opps?.filter(o => o.status === 'applied').length || 0,
        pending: opps?.filter(o => o.status === 'pending').length || 0,
        todosCount: todos?.filter(t => !t.completed).length || 0,
        upcomingDeadlines: opps?.filter(o =>
          o.deadline && new Date(o.deadline) <= nextWeek && new Date(o.deadline) >= today
        ).length || 0
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  }

  async function fetchRecentOpps() {
    try {
      const { data } = await supabase
        .from('opportunities')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(5);

      setRecentOpps(data || []);
    } catch (error) {
      console.error('Recent opps fetch error:', error);
    }
  }

  async function fetchTodayClasses() {
    try {
      const today = new Date().getDay(); // 0 is Sunday, 1 is Monday ... 5 is Friday
      const { data } = await supabase.from('schedule').select('*').eq('day_of_week', today).order('start_time');
      setTodayClasses(data || []);
    } catch (e) { console.error(e); }
  }

  async function fetchTodayMeal() {
    try {
      const res = await fetch('/api/yemek');
      const data = await res.json();
      if (data.success) {
        // Adjust for timezone to get local YYYY-MM-DD
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset).toISOString().split('T')[0];
        const meal = data.meals.find((m: any) => m.date.startsWith(localDate));
        setTodayMeal(meal || null);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchUpcomingDeadlines() {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const { data } = await supabase
        .from('opportunities')
        .select('*')
        .not('status', 'eq', 'rejected')
        .gte('deadline', today.toISOString())
        .lte('deadline', nextWeek.toISOString())
        .order('deadline', { ascending: true })
        .limit(3);
      setUpcomingOppList(data || []);
    } catch (e) { console.error(e); }
  }

  const sources = [
    { name: 'Patika.dev', url: 'https://www.patika.dev/bootcamp', color: 'cyan' },
    { name: 'Youthall', url: 'https://www.youthall.com/etkinlikler/', color: 'pink' },
    { name: 'MLH Hackathons', url: 'https://mlh.io/seasons/2026/events', color: 'indigo' },
    { name: 'Techcareer', url: 'https://www.techcareer.net/bootcamp', color: 'emerald' },
    { name: 'Anbean', url: 'https://anbean.com/etkinlikler', color: 'amber' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12 pb-20 py-10">
        {/* Header Section with Manual Entry */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
        >
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] tracking-[0.3em] uppercase">
                <Activity size={12} className="animate-pulse" />
                <span>Kişisel Kontrol Paneli v2.0</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                Dashboard<span className="text-cyan-500 underline decoration-cyan-500/30 underline-offset-8">_</span>
              </h1>
            </div>
            <p className="text-gray-400 font-light text-xl leading-relaxed max-w-lg">
              Beğendiğin eğitimlerin linkini yapıştır, sistemine ekle. Karmaşa yok, sadece hedeflerin var.
            </p>

            {/* Quick Source Links */}
            <div className="flex flex-wrap gap-2 pt-4">
              {sources.map(source => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all"
                >
                  {source.name} <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>

          <div className="pt-4 lg:pt-0">
            <AddByUrl onAdded={fetchData} />
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard
            icon={<TrendingUp size={24} />}
            value={stats.total}
            label="Toplam Fırsat"
            color="cyan"
            delay={0}
          />
          <StatCard
            icon={<Calendar size={24} />}
            value={stats.applied}
            label="Başvurulanlar"
            color="emerald"
            delay={0.1}
          />
          <StatCard
            icon={<Target size={24} />}
            value={stats.todosCount}
            label="Bekleyen Hedefler"
            color="purple"
            delay={0.2}
          />
          <StatCard
            icon={<BookOpen size={24} />}
            value={stats.upcomingDeadlines}
            label="Yaklaşan Tarihler"
            color="pink"
            delay={0.3}
          />
        </motion.div>

        {/* Dashboard Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Today's Classes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gray-950/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 flex flex-col h-64 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><BookOpen size={64} /></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><BookOpen size={16} /></div>
              <h3 className="font-bold text-white tracking-widest text-sm">BUGÜNKÜ DERSLER</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide relative z-10">
              {todayClasses.length === 0 ? (
                <div className="text-gray-500 text-xs font-medium h-full flex flex-col justify-center items-center text-center"><span className="text-xl mb-1">😎</span>Bugün dersin yok.<br />Tadını çıkar!</div>
              ) : (
                todayClasses.map(c => (
                  <div key={c.id} className="p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5 flex flex-col gap-1">
                    <span className="font-bold text-sm text-white">{c.subject}</span>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                      <Clock size={10} /> {c.start_time.substring(0, 5)} - {c.end_time.substring(0, 5)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Today's Menu */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gray-950/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 flex flex-col h-64 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><UtensilsCrossed size={64} /></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg"><UtensilsCrossed size={16} /></div>
              <h3 className="font-bold text-white tracking-widest text-sm">GÜNÜN MENÜSÜ</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide relative z-10">
              {!todayMeal ? (
                <div className="text-gray-500 text-xs font-medium h-full flex items-center justify-center">Menü bilgisi bulunamadı.</div>
              ) : (
                todayMeal.foods.map((f: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5">
                    <span className="text-xs font-medium text-gray-300 line-clamp-1">{f.name}</span>
                    {f.calories && <span className="text-[9px] text-amber-500/70 font-bold whitespace-nowrap">{f.calories} kcal</span>}
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Upcoming Deadlines */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gray-950/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6 flex flex-col h-64 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><AlertCircle size={64} /></div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg"><AlertCircle size={16} /></div>
              <h3 className="font-bold text-white tracking-widest text-sm">YAKLAŞAN TARİHLER</h3>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide relative z-10">
              {upcomingOppList.length === 0 ? (
                <div className="text-gray-500 text-xs font-medium h-full flex items-center justify-center">Yakın zamanda deadline yok.</div>
              ) : (
                upcomingOppList.map(o => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(o.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
                  return (
                    <div key={o.id} className="p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5 flex flex-col gap-1">
                      <span className="font-bold text-xs text-white line-clamp-1">{o.title}</span>
                      <div className="flex items-center gap-2 text-[10px] text-pink-400 font-bold">
                        <Clock size={10} /> {daysLeft === 0 ? 'BUGÜN' : `${daysLeft} GÜN KALDI`}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <ModuleCard
            href="/opportunities"
            icon={<TrendingUp size={28} />}
            title="FIRSATLAR"
            desc="Staj, hackathon ve eğitim fırsatları"
            color="cyan"
          />
          <ModuleCard
            href="/schedule"
            icon={<BookOpen size={28} />}
            title="DERS PROGRAMI"
            desc="Ders programı ve akademik takvim"
            color="purple"
          />
          <ModuleCard
            href="/todos"
            icon={<Target size={28} />}
            title="HEDEFLER"
            desc="Günlük görev ve hedef takibi"
            color="pink"
          />
          <ModuleCard
            href="/calendar"
            icon={<Calendar size={28} />}
            title="TAKVİM"
            desc="Etkinlik takvimi ve son tarih yönetimi"
            color="blue"
          />
        </div>

        {/* Recent High-Priority Postings */}
        {recentOpps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative group mt-16"
          >
            <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-3xl"></div>
            <div className="relative bg-gray-950/40 backdrop-blur-xl rounded-3xl border border-white/5 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Clock size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Son Eklenenler</h2>
                </div>
                <Link href="/opportunities" className="text-cyan-400 text-sm font-bold flex items-center gap-1 hover:text-cyan-300 transition-colors">
                  TÜMÜNÜ GÖR <ChevronRight size={14} />
                </Link>
              </div>

              <div className="space-y-4">
                {recentOpps.map((opp, idx) => (
                  <motion.div
                    key={opp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (idx * 0.1) }}
                    className="group/item flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 gap-4"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-white group-hover/item:text-cyan-300 transition-colors">{opp.title}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 uppercase tracking-widest font-medium">
                        <span className="text-gray-400">{opp.source}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                        <span className="text-cyan-500/60">{opp.category}</span>
                      </div>
                    </div>
                    <Link
                      href="/opportunities"
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black group-hover/item:bg-cyan-500 group-hover/item:text-white transition-all duration-300"
                    >
                      GO TO EVENT <ArrowUpRight size={14} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color, delay }: { icon: any, value: number, label: string, color: string, delay: number }) {
  const themes: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20 shadow-purple-500/10",
    pink: "text-pink-400 bg-pink-500/10 border-pink-500/20 shadow-pink-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative h-40 flex flex-col justify-between p-6 rounded-3xl bg-gray-950/40 backdrop-blur-xl border border-white/5 shadow-2xl group overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
        {icon}
      </div>
      <div className={`w-10 h-10 flex items-center justify-center rounded-xl border ${themes[color]}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-4xl font-black text-white tracking-tighter mb-1 select-none">
          {value.toString().padStart(2, '0')}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{label}</p>
      </div>
      <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${color === 'cyan' ? 'from-cyan-500 to-blue-500' : color === 'emerald' ? 'from-emerald-500 to-teal-500' : color === 'purple' ? 'from-purple-500 to-indigo-500' : 'from-pink-500 to-rose-500'} scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500`}></div>
    </motion.div>
  );
}

function ModuleCard({ href, icon, title, desc, color }: { href: string, icon: any, title: string, desc: string, color: string }) {
  const glowShadows: Record<string, string> = {
    cyan: "group-hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.3)]",
    purple: "group-hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]",
    pink: "group-hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.3)]",
    blue: "group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]",
  };

  const glows: Record<string, string> = {
    cyan: "group-hover:bg-cyan-500 group-hover:border-cyan-400",
    purple: "group-hover:bg-purple-500 group-hover:border-purple-400",
    pink: "group-hover:bg-pink-500 group-hover:border-pink-400",
    blue: "group-hover:bg-blue-500 group-hover:border-blue-400",
  };

  return (
    <Link href={href} className="group">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`relative h-44 p-8 rounded-[2rem] bg-gray-950/40 backdrop-blur-xl border border-white/5 shadow-2xl transition-all duration-300 overflow-hidden ${glowShadows[color]}`}
      >
        <div className="absolute top-0 right-0 p-8 text-white/5 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-150 group-hover:scale-100">
          {icon}
        </div>
        <div className="flex flex-col h-full justify-between relative z-10">
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 text-white transition-all duration-500 ${glows[color]}`}>
              {icon}
            </div>
            <ArrowUpRight className="text-gray-600 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white tracking-widest mb-1">{title}</h3>
            <p className="text-sm text-gray-500 font-light group-hover:text-gray-300 transition-colors uppercase tracking-tight">{desc}</p>
          </div>
        </div>
        <div className="absolute -bottom-1 -left-1 w-24 h-24 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl group-hover:from-white/10 transition-all"></div>
      </motion.div>
    </Link>
  );
}
