'use client';
import { motion } from 'framer-motion';
import { ExternalLink, Heart, CheckCircle, MapPin, X } from 'lucide-react';

interface EventDetailModalProps {
    event: any;
    currentTab?: string;
    onClose: () => void;
    onStatusChange: (id: string, newStatus: string) => void;
}

export default function EventDetailModal({ event, currentTab = 'all', onClose, onStatusChange }: EventDetailModalProps) {
    if (!event) return null;

    const { id, title, url, deadline, category, source: organizer, location_type: type, status } = event;

    // Kategori Renkleri
    const categoryConfig: Record<string, { gradient: string; glow: string }> = {
        hackathon: { gradient: 'from-purple-500 to-pink-500', glow: 'shadow-purple-500/50' },
        staj: { gradient: 'from-green-500 to-emerald-500', glow: 'shadow-emerald-500/50' },
        is_ilani: { gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/50' },
        bootcamp: { gradient: 'from-cyan-500 to-blue-500', glow: 'shadow-cyan-500/50' },
        etkinlik: { gradient: 'from-gray-500 to-slate-500', glow: 'shadow-gray-500/50' }
    };
    const config = categoryConfig[category] || { gradient: 'from-gray-500 to-slate-500', glow: 'shadow-gray-500/50' };

    // Badge Render İşlevi
    const renderBadge = () => {
        if (status === 'accepted') {
            return (
                <div className="absolute top-6 left-6 -rotate-12 bg-emerald-500 text-black px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.5)] border-2 border-emerald-400">
                    ✅ ONAYLANDI
                </div>
            );
        } else if (status === 'rejected') {
            return (
                <div className="absolute top-6 left-6 -rotate-12 bg-red-500 text-white px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.5)] border-2 border-red-400">
                    ❌ ONAYLANMADI
                </div>
            );
        } else if (status === 'certificate' || currentTab === 'certificates') {
            return (
                <div className="absolute top-6 left-6 -rotate-12 bg-amber-500 text-black px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(245,158,11,0.5)] border-2 border-amber-400">
                    🏆 TAMAMLANDI
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl relative bg-gray-950/80 border border-white/10 rounded-3xl p-8 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/20 rounded-full text-gray-400 hover:text-white transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Status Badges */}
                {renderBadge()}

                {/* Content Header */}
                <div className="mb-8 pt-8 text-center space-y-4">
                    <div className="flex items-center justify-center gap-2">
                        <div className={`px-3 py-1 text-xs font-bold rounded-md bg-gradient-to-r ${config.gradient} text-white uppercase tracking-wider ${config.glow}`}>
                            {category}
                        </div>
                        <div className="px-3 py-1 flex items-center gap-2 border border-white/10 rounded-md bg-white/5 text-gray-300 text-xs">
                            <MapPin size={12} className="text-blue-400" />
                            <span>{type || 'TR'}</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-white leading-tight">
                        {title}
                    </h2>
                    <p className="text-sm font-medium text-cyan-400 uppercase tracking-widest">
                        By {organizer || 'Bilinmiyor'}
                    </p>

                    {deadline && (
                        <div className="mt-4 inline-block px-4 py-2 border border-white/5 bg-white/5 rounded-xl text-sm text-gray-400">
                            Son Başvuru: <span className="font-bold text-white">{new Date(deadline).toLocaleDateString('tr-TR')}</span>
                        </div>
                    )}
                </div>

                {/* Process Pipeline Buttons */}
                <div className="pt-6 border-t border-white/10 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-1 sm:col-span-2 flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-2xl text-white font-bold group transition-all"
                    >
                        <span>İLAN SAYFASINA GİT</span>
                        <ExternalLink size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </a>

                    {/* Tüm İlanlar (all) ve İstek Listesi (wishlist) Süreci */}
                    {(currentTab === 'all' || currentTab === 'wishlist') && (
                        <>
                            {currentTab === 'all' && status !== 'wishlist' && (
                                <button
                                    onClick={() => { onStatusChange(id, 'wishlist'); onClose(); }}
                                    className="flex items-center justify-center gap-3 p-4 bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-500/20 hover:border-pink-500 rounded-2xl font-bold transition-all"
                                >
                                    <Heart size={18} /> İSTEK LİSTESİNE EKLE
                                </button>
                            )}
                            <button
                                onClick={() => { onStatusChange(id, 'applied'); onClose(); }}
                                className={`flex items-center justify-center gap-3 p-4 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500 rounded-2xl font-bold transition-all ${currentTab === 'wishlist' ? 'col-span-1 sm:col-span-2' : ''}`}
                            >
                                <CheckCircle size={18} /> BAŞVURDUM OLARAK İŞARETLE
                            </button>
                        </>
                    )}

                    {/* Başvurularım (applied) - Kabul / Red */}
                    {currentTab === 'applied' && (
                        <>
                            <button
                                onClick={() => { onStatusChange(id, 'accepted'); onClose(); }}
                                className="flex items-center justify-center gap-3 p-4 bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 rounded-2xl font-black transition-all"
                            >
                                <CheckCircle size={18} /> ONAYLANDI
                            </button>
                            <button
                                onClick={() => { onStatusChange(id, 'rejected'); onClose(); }}
                                className="flex items-center justify-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500 rounded-2xl font-bold transition-all"
                            >
                                <X size={18} /> ONAYLANMADI
                            </button>
                        </>
                    )}

                    {/* Sonuçlarım (archived) -> ONAYLANDI olanlara sertifika hakkı */}
                    {currentTab === 'archived' && status === 'accepted' && (
                        <button
                            onClick={() => { onStatusChange(id, 'certificate'); onClose(); }}
                            className="col-span-1 sm:col-span-2 flex items-center justify-center gap-3 p-4 bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 rounded-2xl font-black transition-all"
                        >
                            🏆 EĞİTİMİ BİTİRDİM / SERTİFİKA YÜKLE
                        </button>
                    )}

                    {/* İşlemi Geri Al (Gerektiğinde tüm arşiv sekmelerinde gösterilebilir) */}
                    {(status === 'accepted' || status === 'rejected' || status === 'certificate') && (currentTab === 'archived' || currentTab === 'certificates') && (
                        <button
                            onClick={() => { onStatusChange(id, 'applied'); onClose(); }}
                            className="col-span-1 sm:col-span-2 flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-2xl font-bold transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            SÜRECİ GERİ AL
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
