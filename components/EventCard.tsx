'use client';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin, Heart, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';

interface EventCardProps {
    id: string;
    title: string;
    url: string;
    deadline?: string | null;
    category: string;
    organizer: string;
    type: string;
    status: string;
    onStatusChange: (id: string, newStatus: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    index: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; gradient: string; text: string }> = {
    hackathon: { label: 'Hackathon', gradient: 'from-purple-500 to-pink-500', text: 'text-purple-300' },
    is_staj: { label: 'Staj / İş', gradient: 'from-green-500 to-emerald-500', text: 'text-emerald-300' },
    bootcamp: { label: 'Eğitim', gradient: 'from-cyan-500 to-blue-500', text: 'text-cyan-300' },
    etkinlik: { label: 'Etkinlik', gradient: 'from-orange-500 to-amber-500', text: 'text-amber-300' },
};

export default function EventCard({
    id, title, url, deadline, category, organizer, type,
    status, onStatusChange, onEdit, onDelete, index
}: EventCardProps) {
    const cfg = CATEGORY_CONFIG[category] ?? { label: category, gradient: 'from-gray-500 to-slate-500', text: 'text-gray-300' };

    const borderClass = status === 'accepted'
        ? 'bg-emerald-950/20 border-emerald-500/30'
        : status === 'rejected'
            ? 'bg-red-950/20 border-red-500/30'
            : 'bg-gray-950/40 border-white/5 group-hover:border-white/20';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ delay: index * 0.08, duration: 0.6, type: 'spring', stiffness: 90 }}
            whileHover={{ scale: 1.02, y: -6, transition: { duration: 0.25 } }}
            className="group relative"
        >
            {/* Glow */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${cfg.gradient} rounded-2xl opacity-0 group-hover:opacity-15 blur-2xl transition-opacity duration-500`} />

            {/* Card */}
            <div className={`relative h-full flex flex-col backdrop-blur-2xl border rounded-2xl p-5 transition-all duration-400 overflow-hidden ${borderClass}`}>

                {/* Shine sweep */}
                <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] group-hover:left-[150%] transition-all duration-1000 pointer-events-none" />

                {/* Kabul / Red ribbon */}
                {(status === 'accepted' || status === 'rejected') && (
                    <div className="absolute -right-10 top-5 bg-black/60 rotate-45 w-40 text-center py-1 flex items-center justify-center gap-1 border-y border-white/10 backdrop-blur-md">
                        {status === 'accepted'
                            ? <><CheckCircle size={11} className="text-emerald-400" /><span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Kabul!</span></>
                            : <><span className="text-[9px] font-black uppercase tracking-widest text-red-400">✕ Reddedildi</span></>
                        }
                    </div>
                )}

                {/* ── TOP SECTION ── */}
                <div className="flex flex-col gap-3 flex-1">

                    {/* Row 1: Deadline badge */}
                    <div>
                        <DeadlineBadge deadline={deadline} />
                    </div>

                    {/* Row 2: Title + organizer */}
                    <div>
                        <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors duration-200 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                            {title}
                        </h3>
                        <p className="text-[10px] font-semibold text-cyan-400/70 uppercase tracking-widest mt-1 truncate">
                            {organizer}
                        </p>
                    </div>

                    {/* Row 3: Location + Category badges — same row, no overlap */}
                    <div className="flex items-center gap-2 flex-wrap mt-auto pt-3 border-t border-white/5">
                        {/* Location badge */}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 font-medium">
                            <MapPin size={10} className="text-blue-400 shrink-0" />
                            {type === 'TR' ? '🇹🇷 Türkiye' : type === 'Global' ? '🌍 Global' : type}
                        </span>

                        {/* Category badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r ${cfg.gradient} text-white uppercase tracking-wider`}>
                            {cfg.label}
                        </span>
                    </div>
                </div>

                {/* ── FOOTER ACTIONS ── */}
                <div className="mt-4 flex items-center gap-2">
                    {/* Status action buttons */}
                    <div className="flex items-center gap-1">
                        {(status === 'new' || status === 'wishlist' || status === 'pending' || !status) && (
                            <>
                                {status !== 'wishlist' && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                        onClick={(e) => { e.stopPropagation(); onStatusChange(id, 'wishlist'); }}
                                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-pink-500 hover:border-pink-500/50 hover:shadow-[0_0_12px_rgba(236,72,153,0.3)] transition-all"
                                        title="İstek Listesine Ekle"
                                    >
                                        <Heart size={16} />
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onStatusChange(id, 'applied'); }}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-cyan-500 hover:border-cyan-500/50 hover:shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
                                    title="Başvurdum"
                                >
                                    <CheckCircle size={16} />
                                </motion.button>
                            </>
                        )}

                        {status === 'applied' && (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onStatusChange(id, 'accepted'); }}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-emerald-500 hover:border-emerald-500/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all"
                                    title="Kabul Edildi"
                                >
                                    <CheckCircle size={16} />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); onStatusChange(id, 'rejected'); }}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-red-500 hover:border-red-500/50 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all"
                                    title="Reddedildi"
                                >
                                    <span className="text-sm font-bold">✕</span>
                                </motion.button>
                            </>
                        )}

                        {(status === 'accepted' || status === 'rejected') && (
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onStatusChange(id, 'applied'); }}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-gray-500 hover:text-gray-300 hover:border-gray-500/50 transition-all"
                                title="Geri Al"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            </motion.button>
                        )}

                        {/* Edit & Delete — her zaman görünür */}
                        {onEdit && (
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onEdit(id); }}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-yellow-400 hover:border-yellow-400/50 hover:shadow-[0_0_12px_rgba(250,204,21,0.3)] transition-all"
                                title="Düzenle"
                            >
                                <Pencil size={15} />
                            </motion.button>
                        )}

                        {onDelete && (
                            <motion.button
                                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-red-500 hover:border-red-500/50 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all"
                                title="Sil"
                            >
                                <Trash2 size={15} />
                            </motion.button>
                        )}
                    </div>

                    {/* View link */}
                    <motion.a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-2 h-9 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-xl text-white text-xs font-bold transition-all duration-300"
                    >
                        <span>GÖRÜNTÜLE</span>
                        <ExternalLink size={12} />
                    </motion.a>
                </div>
            </div>
        </motion.div>
    );
}
