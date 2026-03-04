'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrendingUp, Calendar as CalendarIcon, Target, BookOpen, UtensilsCrossed, Timer, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home, color: 'from-blue-500 to-cyan-400' },
    { href: '/opportunities', label: 'Fırsatlar', icon: TrendingUp, color: 'from-purple-500 to-pink-400' },
    { href: '/schedule', label: 'Ders Programı', icon: BookOpen, color: 'from-emerald-500 to-teal-400' },
    { href: '/pomodoro', label: 'Pomodoro', icon: Timer, color: 'from-orange-500 to-amber-400' },
    { href: '/todos', label: 'Hedefler', icon: Target, color: 'from-cyan-500 to-blue-400' },
    { href: '/calendar', label: 'Takvim', icon: CalendarIcon, color: 'from-indigo-500 to-purple-400' },
    { href: '/yemek', label: 'Yemekhane', icon: UtensilsCrossed, color: 'from-rose-500 to-red-400' },
];

export default function MobileNav() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const currentPage = navLinks.find(l => l.href === pathname) ?? navLinks[0];

    return (
        <>
            {/* Top bar — mobile only */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 bg-gray-950/90 backdrop-blur-xl border-b border-white/5">
                <Link href="/" className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tighter">
                    Tak
                </Link>

                {/* Current page indicator */}
                <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                    <currentPage.icon size={16} />
                    <span>{currentPage.label}</span>
                </div>

                {/* Hamburger */}
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all"
                >
                    <Menu size={20} />
                </button>
            </header>

            {/* Drawer overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                        />

                        {/* Slide-in drawer from left */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="md:hidden fixed top-0 left-0 bottom-0 w-72 z-50 bg-gray-950/95 backdrop-blur-2xl border-r border-white/5 flex flex-col p-6"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <Link href="/" onClick={() => setIsOpen(false)}>
                                    <h2 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tighter">Tak</h2>
                                </Link>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Nav links */}
                            <nav className="flex flex-col gap-1 flex-1">
                                {navLinks.map((link, i) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <motion.div
                                            key={link.href}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Link
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200 ${isActive
                                                        ? 'bg-white/10 text-white shadow-lg'
                                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {/* Icon with gradient bubble */}
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${link.color} ${isActive ? 'shadow-lg' : 'opacity-60'}`}>
                                                    <link.icon size={17} className="text-white" />
                                                </div>
                                                <span>{link.label}</span>
                                                {isActive && (
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                                )}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            {/* Footer */}
                            <p className="text-[10px] text-gray-700 font-mono tracking-wider mt-6">TAK v2.0 · © 2026</p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
