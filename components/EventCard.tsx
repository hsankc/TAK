'use client';
import { motion } from 'framer-motion';
import { ExternalLink, MapPin, Heart, CheckCircle } from 'lucide-react';
import { DeadlineBadge } from './DeadlineBadge';

interface EventCardProps {
    id: string;
    title: string;
    url: string;
    deadline?: string | null;
    category: string;
    organizer: string;
    type: 'Online' | 'Physical' | string;
    status: string;
    onStatusChange: (id: string, newStatus: string) => void;
    index: number;
}

export default function EventCard({
    id,
    title,
    url,
    deadline,
    category,
    organizer,
    type,
    status,
    onStatusChange,
    index
}: EventCardProps) {

    const categoryConfig: Record<string, { color: string; gradient: string; glow: string }> = {
        hackathon: {
            color: 'from-purple-500/20 to-pink-500/20',
            gradient: 'from-purple-500 to-pink-500',
            glow: 'shadow-purple-500/50'
        },
        staj: {
            color: 'from-green-500/20 to-emerald-500/20',
            gradient: 'from-green-500 to-emerald-500',
            glow: 'shadow-emerald-500/50'
        },
        is_ilani: {
            color: 'from-amber-500/20 to-orange-500/20',
            gradient: 'from-amber-500 to-orange-600',
            glow: 'shadow-amber-500/50'
        },
        bootcamp: {
            color: 'from-cyan-500/20 to-blue-500/20',
            gradient: 'from-cyan-500 to-blue-500',
            glow: 'shadow-cyan-500/50'
        },
        etkinlik: {
            color: 'from-gray-500/20 to-slate-500/20',
            gradient: 'from-gray-500 to-slate-500',
            glow: 'shadow-gray-500/50'
        }
    };

    const config = categoryConfig[category] || {
        color: 'from-gray-500/20 to-slate-500/20',
        gradient: 'from-gray-500 to-slate-500',
        glow: 'shadow-gray-500/50'
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{
                delay: index * 0.1,
                duration: 0.8,
                type: "spring",
                stiffness: 80
            }}
            whileHover={{
                scale: 1.02,
                y: -10,
                transition: { duration: 0.3 }
            }}
            className="group relative"
        >
            {/* Dynamic Glow Aura */}
            <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500`}></div>

            {/* Main Glass Panel */}
            <div className={`relative h-full flex flex-col backdrop-blur-2xl border rounded-2xl p-6 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden ${status === 'accepted' ? 'bg-emerald-950/20 border-emerald-500/30' :
                status === 'rejected' ? 'bg-red-950/20 border-red-500/30' :
                    'bg-gray-950/40 border-white/5 group-hover:border-white/20 group-hover:shadow-[0_0_80px_-12px_rgba(255,255,255,0.1)]'
                }`}>

                {/* Animated Inner Shine */}
                <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] group-hover:left-[150%] transition-all duration-1000"></div>

                {/* Archived Badge */}
                {(status === 'accepted' || status === 'rejected') && (
                    <div className="absolute -right-12 top-6 bg-black/60 rotate-45 w-48 text-center py-1 flex items-center justify-center gap-2 border-y border-white/10 shadow-xl backdrop-blur-md">
                        {status === 'accepted' ? (
                            <><CheckCircle size={12} className="text-emerald-400" /><span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Kabul!</span></>
                        ) : (
                            <><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg><span className="text-[10px] font-black uppercase tracking-widest text-red-400">Reddedildi</span></>
                        )}
                    </div>
                )}

                {/* Header Section */}
                <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 w-full pr-12">
                        <div className="flex items-center gap-2 mb-1">
                            <DeadlineBadge deadline={deadline} />
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight leading-snug drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] group-hover:text-cyan-300 transition-colors duration-200 line-clamp-2">
                            {title}
                        </h3>
                        <p className="text-[10px] font-medium text-cyan-400/80 uppercase tracking-widest truncate">
                            {organizer}
                        </p>
                    </div>

                    {/* Info Grid */}
                    <div className="flex-1 flex flex-col justify-end space-y-3 mt-4 border-t border-white/5 pt-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin size={12} className="text-blue-400" />
                                <span className="text-[11px] text-gray-400 font-light">{type}</span>
                            </div>
                            <div className={`px-2 py-0.5 text-[9px] font-bold rounded bg-gradient-to-r ${config.gradient} text-white uppercase tracking-wider`}>
                                {category}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {(status === 'new' || status === 'wishlist' || !status) && (
                            <>
                                {status !== 'wishlist' && (
                                    <motion.button
                                        whileHover={{ scale: 1.1, zIndex: 10 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => onStatusChange(id, 'wishlist')}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-pink-500 hover:text-pink-400 hover:border-pink-500/50 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all"
                                        title="İstek Listesine Ekle"
                                    >
                                        <Heart size={18} />
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.1, zIndex: 10 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onStatusChange(id, 'applied')}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-cyan-500 hover:text-cyan-400 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                                    title="Başvurdum İşaretle"
                                >
                                    <CheckCircle size={18} />
                                </motion.button>
                            </>
                        )}

                        {status === 'applied' && (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.1, zIndex: 10 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onStatusChange(id, 'accepted')}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-emerald-500 hover:text-emerald-400 hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                                    title="Olumlu (Kabul!)"
                                >
                                    <CheckCircle size={18} />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.1, zIndex: 10 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onStatusChange(id, 'rejected')}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-red-500 hover:text-red-400 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all"
                                    title="Olumsuz (Red)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                </motion.button>
                            </>
                        )}

                        {(status === 'accepted' || status === 'rejected') && (
                            <motion.button
                                whileHover={{ scale: 1.1, zIndex: 10 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => onStatusChange(id, 'applied')}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-900 border border-white/10 text-gray-500 hover:text-gray-300 hover:border-gray-500/50 transition-all"
                                title="Geri Al (Başvurulara)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                            </motion.button>
                        )}
                    </div>

                    <motion.a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 h-10 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 rounded-xl text-white text-sm font-bold group/btn transition-all duration-300"
                    >
                        <span>GÖRÜNTÜLE</span>
                        <ExternalLink size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </motion.a>
                </div>
            </div>
        </motion.div>
    );
}
