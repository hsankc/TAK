'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import AddByUrl from '@/components/AddByUrl';
import { Sparkles, Inbox, LayoutGrid } from 'lucide-react';
import EventList from '@/components/EventList';
import EventDetailModal from '@/components/EventDetailModal';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, [filter]);

  async function fetchOpportunities() {
    setLoading(true);
    try {
      let query = supabase.from('opportunities').select('*').order('scraped_at', { ascending: false });

      if (filter !== 'all') {
        if (filter === 'archived') {
          query = query.in('status', ['accepted', 'rejected']);
        } else if (filter === 'certificates') {
          query = query.eq('status', 'certificate');
        } else {
          query = query.eq('status', filter);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    try {
      const { error } = await supabase.from('opportunities').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchOpportunities();
    } catch (error) {
      console.error('Update error:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu ilanı silmek istediğine emin misin?')) return;
    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) throw error;
      fetchOpportunities();
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  function handleEdit(id: string) {
    const event = opportunities.find(o => o.id === id);
    if (event) setSelectedEvent(event);
  }

  const filters = [
    { value: 'all', label: 'TÜMÜ' },
    { value: 'wishlist', label: 'İSTEK LİSTEM' },
    { value: 'applied', label: 'BAŞVURULARIM' },
    { value: 'archived', label: 'SONUÇLARIM' },
    { value: 'certificates', label: 'BELGELERİM' }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white p-6 relative overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-blue-500 w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.4em] text-blue-500 uppercase">Fırsat Takip Merkezi</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-white/80 to-white/20 bg-clip-text text-transparent tracking-tighter">
              Kariyer Üssü
            </h1>
          </motion.div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="group relative px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/25 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative z-10 flex items-center gap-2">+ YENİ EKLE</span>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-white/5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-5 py-2.5 rounded-xl font-bold text-[11px] tracking-widest whitespace-nowrap transition-all duration-300 ${filter === f.value
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                : 'bg-transparent text-gray-500 border border-transparent hover:bg-white/5 hover:text-white'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="relative">
          {opportunities.length === 0 && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-40 text-gray-600"
            >
              <Inbox size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium uppercase tracking-widest">Henüz ilan eklenmemiş</p>
              <p className="text-xs font-light mt-1">"Yeni Ekle" butonuna tıklayarak başla.</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <EventList
                key={filter}
                events={opportunities}
                onStatusChange={updateStatus}
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
                onCardClick={setSelectedEvent}
              />
            </AnimatePresence>
          )}
        </div>

        {/* --- ADD MODAL --- */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-lg relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="absolute -top-12 right-0 flex justify-end">
                  <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
                <AddByUrl onAdded={() => { fetchOpportunities(); setIsAddModalOpen(false); }} />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- EVENT DETAIL MODAL --- */}
        <AnimatePresence>
          {selectedEvent && (
            <EventDetailModal
              event={selectedEvent}
              currentTab={filter}
              onClose={() => setSelectedEvent(null)}
              onStatusChange={(id, newStatus) => {
                updateStatus(id, newStatus);
                // Güncellemenin anında modala yansıması için state'i de güncelliyoruz
                setSelectedEvent({ ...selectedEvent, status: newStatus });
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
