'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, BookOpen, CheckCircle, Plus, ChevronDown, Save, X, History, Clock, Square, ChevronRight, BarChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MODES = {
    FOCUS: { id: 'FOCUS', label: 'Odaklanma', defaultMinutes: 60, color: 'cyan' },
    BREAK: { id: 'BREAK', label: 'Mola', defaultMinutes: 10, color: 'emerald' }
};

interface Session {
    id: string;
    subject: string;
    duration_minutes: number;
    notes: string;
    created_at: string;
}

interface GroupedSubject {
    subject: string;
    totalMinutes: number;
    totalSessions: number;
    lastActive: string;
    sessions: Session[];
}

export default function PomodoroPage() {
    const [viewMode, setViewMode] = useState<'TIMER' | 'HISTORY'>('TIMER');

    // Timer States
    const [mode, setMode] = useState(MODES.FOCUS);
    const [focusMinutes, setFocusMinutes] = useState(MODES.FOCUS.defaultMinutes);
    const [breakMinutes, setBreakMinutes] = useState(MODES.BREAK.defaultMinutes);
    const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.defaultMinutes * 60);
    const [isActive, setIsActive] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Dropdown / Subject States
    const [subjects, setSubjects] = useState<string[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newSubject, setNewSubject] = useState('');

    // Modal & History States
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [sessionNotes, setSessionNotes] = useState('');
    const [rawHistory, setRawHistory] = useState<Session[]>([]);
    const [groupedHistory, setGroupedHistory] = useState<GroupedSubject[]>([]);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const playBeep = () => {
        if (typeof window !== 'undefined') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => { });
        }
    };

    useEffect(() => {
        fetchSubjects();
        fetchHistory();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Effect for grouping history
    useEffect(() => {
        if (rawHistory.length === 0) {
            setGroupedHistory([]);
            return;
        }

        const groups = rawHistory.reduce((acc, session) => {
            if (!acc[session.subject]) {
                acc[session.subject] = {
                    subject: session.subject,
                    totalMinutes: 0,
                    totalSessions: 0,
                    lastActive: session.created_at, // İlk eleman en yenisi olduğu için
                    sessions: []
                };
            }
            acc[session.subject].totalMinutes += session.duration_minutes;
            acc[session.subject].totalSessions += 1;
            acc[session.subject].sessions.push(session);

            // Update lastActive if older
            if (new Date(session.created_at) > new Date(acc[session.subject].lastActive)) {
                acc[session.subject].lastActive = session.created_at;
            }

            return acc;
        }, {} as Record<string, GroupedSubject>);

        const sortedGroups = Object.values(groups).sort((a, b) =>
            new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
        );

        setGroupedHistory(sortedGroups);
    }, [rawHistory]);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            setIsActive(false);
            setHasStarted(false);
            playBeep();
            if (interval) clearInterval(interval);
            if (mode.id === 'FOCUS') {
                setShowSessionModal(true);
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, mode]);

    async function fetchSubjects() {
        try {
            const { data } = await supabase.from('schedule').select('subject');
            if (data) {
                const unique = Array.from(new Set(data.map(d => d.subject))).sort();
                setSubjects(unique);
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function fetchHistory() {
        try {
            // Dashboard için bol veri çekelim
            const { data } = await supabase.from('pomodoro_sessions').select('*').order('created_at', { ascending: false }).limit(200);
            if (data) setRawHistory(data);
        } catch (e) {
            console.error(e);
        }
    }

    function handleModeChange(newMode: any) {
        setMode(newMode);
        setIsActive(false);
        setHasStarted(false);
        const mins = newMode.id === 'FOCUS' ? focusMinutes : breakMinutes;
        setTimeLeft(mins * 60);
    }

    function handleMinutesChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = parseInt(e.target.value) || 0;
        if (mode.id === 'FOCUS') {
            setFocusMinutes(val);
            if (!hasStarted) setTimeLeft(val * 60);
        } else {
            setBreakMinutes(val);
            if (!hasStarted) setTimeLeft(val * 60);
        }
    }

    function startTimer() {
        setHasStarted(true);
        setIsActive(true);
    }

    function toggleTimer() {
        setIsActive(!isActive);
    }

    function endSessionEarly() {
        setIsActive(false);
        setHasStarted(false);
        if (mode.id === 'FOCUS') {
            setShowSessionModal(true);
        } else {
            resetTimer();
        }
    }

    function resetTimer() {
        setIsActive(false);
        setHasStarted(false);
        const mins = mode.id === 'FOCUS' ? focusMinutes : breakMinutes;
        setTimeLeft(mins * 60);
    }

    async function saveSession() {
        if (!selectedSubject && !newSubject) return;
        setIsSaving(true);
        const initialDuration = mode.id === 'FOCUS' ? focusMinutes : breakMinutes;
        const workedSeconds = (initialDuration * 60) - timeLeft;
        const workedMinutes = Math.max(1, Math.ceil(workedSeconds / 60));

        const finalSubject = isAddingNew ? newSubject : selectedSubject;

        try {
            const { data, error } = await supabase.from('pomodoro_sessions').insert([
                {
                    subject: finalSubject,
                    duration_minutes: workedMinutes,
                    notes: sessionNotes
                }
            ]).select();

            if (error) {
                console.error("SUPABASE ERROR:", error);
                alert("Veritabanı Kayıt Hatası: " + error.message);
            } else if (data) {
                setRawHistory([data[0], ...rawHistory]);
                if (isAddingNew && !subjects.includes(newSubject)) {
                    setSubjects([...subjects, newSubject].sort());
                }
            }
        } catch (e: any) {
            console.error("CATCH ERROR:", e);
            alert("Sistem Hatası: " + e.message);
        } finally {
            setIsSaving(false);
            setShowSessionModal(false);
            setSessionNotes('');
            setIsAddingNew(false);
            resetTimer();
        }
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins} dk`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h} sa ${m} dk` : `${h} sa`;
    };

    const currentMaxMins = mode.id === 'FOCUS' ? focusMinutes : breakMinutes;
    const progress = currentMaxMins > 0 ? Math.max(0, Math.min(100, ((currentMaxMins * 60 - timeLeft) / (currentMaxMins * 60)) * 100)) : 0;

    const bgColors: any = { cyan: 'bg-cyan-500', emerald: 'bg-emerald-500' };
    const textColors: any = { cyan: 'text-cyan-400', emerald: 'text-emerald-400' };
    const borderColors: any = { cyan: 'border-cyan-500/50', emerald: 'border-emerald-500/50' };
    const glowColors: any = { cyan: 'shadow-cyan-500/50', emerald: 'shadow-emerald-500/50' };

    const activeSubjectName = isAddingNew ? newSubject : selectedSubject;

    const toggleSubjectExpand = (subj: string) => {
        if (expandedSubject === subj) setExpandedSubject(null);
        else setExpandedSubject(subj);
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white p-4 md:p-8 relative overflow-y-auto flex flex-col items-center">
            {/* Background gradients */}
            <div className="fixed inset-0 pointer-events-none transition-all duration-1000 z-0">
                <div className={`absolute top-[10%] left-[20%] w-[30%] h-[30%] ${viewMode === 'TIMER' ? bgColors[mode.color] : 'bg-blue-500'} opacity-10 rounded-full blur-[120px] ${isActive ? 'animate-pulse' : ''}`}></div>
                <div className={`absolute bottom-[10%] right-[20%] w-[30%] h-[30%] ${viewMode === 'TIMER' ? bgColors[mode.color] : 'bg-indigo-500'} opacity-5 rounded-full blur-[100px]`}></div>
            </div>

            {/* Top Right Action Buttons */}
            <div className="w-full max-w-5xl mx-auto flex justify-end z-20 mb-8 mt-4 md:mt-0">
                <button
                    onClick={() => setViewMode(viewMode === 'TIMER' ? 'HISTORY' : 'TIMER')}
                    className="flex items-center gap-2 px-5 py-3 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold uppercase tracking-widest text-gray-300 transition-colors backdrop-blur-md shadow-lg"
                >
                    {viewMode === 'TIMER' ? (
                        <><BarChart size={18} className="text-cyan-400" /> <span className="hidden md:inline">Öğrenme Analitiği</span></>
                    ) : (
                        <><Timer size={18} className="text-emerald-400" /> <span className="hidden md:inline">Zamanlayıcıya Dön</span></>
                    )}
                </button>
            </div>

            <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[70vh]">

                <AnimatePresence mode="wait">
                    {/* ===== TIMER VIEW ===== */}
                    {viewMode === 'TIMER' && (
                        <motion.div
                            key="timer-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-2xl flex flex-col items-center"
                        >
                            {/* --- HEADER --- */}
                            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                                <div className={`flex items-center justify-center gap-3 mb-2 ${textColors[mode.color]}`}>
                                    <Timer className={isActive ? 'animate-bounce' : ''} size={24} />
                                    <span className="font-mono text-xs tracking-[0.3em] uppercase font-bold">Odaklanma Merkezi</span>
                                </div>
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {!hasStarted ? (
                                    /* --- SETUP VIEW --- */
                                    <motion.div
                                        key="setup-view"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                                        className="w-full flex flex-col items-center"
                                    >
                                        {/* Mode Selector and Custom Time */}
                                        <div className="flex flex-col items-center gap-5 w-full mb-10">
                                            <div className="flex bg-white/[0.03] p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
                                                {Object.values(MODES).map((m) => (
                                                    <button
                                                        key={m.id}
                                                        onClick={() => handleModeChange(m)}
                                                        className={`px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${mode.id === m.id ? `${bgColors[m.color]} text-black ${glowColors[m.color]} shadow-lg` : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                                    >
                                                        {m.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Time Input */}
                                            <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-md shadow-inner">
                                                <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">Süre (Dk):</span>
                                                <input
                                                    type="number"
                                                    min="1" max="999"
                                                    value={mode.id === 'FOCUS' ? focusMinutes : breakMinutes}
                                                    onChange={handleMinutesChange}
                                                    className={`bg-transparent border-b-2 ${borderColors[mode.color]} px-2 py-1 text-white text-center text-3xl font-black w-24 focus:outline-none focus:border-white transition-colors`}
                                                />
                                            </div>
                                        </div>

                                        {/* Course Selector */}
                                        {mode.id === 'FOCUS' && (
                                            <div className="w-full max-w-md mb-10 z-[100]" ref={dropdownRef}>
                                                <div className={`bg-[#0a0f1c] border rounded-2xl p-5 shadow-2xl transition-colors duration-300 border-white/10`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <BookOpen size={16} className={textColors[mode.color] || "text-gray-400"} />
                                                        <span className={`text-xs font-bold uppercase tracking-widest text-cyan-400`}>Hangi Konuya Çalışacaksın?</span>
                                                    </div>

                                                    <div className="relative">
                                                        {!isAddingNew ? (
                                                            <button
                                                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                                className="w-full bg-[#111827] border border-white/10 rounded-xl px-5 py-4 flex items-center justify-between hover:bg-white/5 hover:border-white/30 transition-all text-sm shadow-inner"
                                                            >
                                                                <span className={selectedSubject ? 'text-white font-medium' : 'text-gray-500'}>
                                                                    {selectedSubject || 'Konu/Ders Seçin...'}
                                                                </span>
                                                                <ChevronDown size={18} className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`} />
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    autoFocus
                                                                    type="text"
                                                                    placeholder="Örn: Limit ve Süreklilik..."
                                                                    value={newSubject}
                                                                    onChange={(e) => setNewSubject(e.target.value)}
                                                                    className="flex-1 bg-[#111827] border border-cyan-500/50 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors shadow-inner"
                                                                />
                                                                <button onClick={() => { setIsAddingNew(false); setSelectedSubject(newSubject); setIsDropdownOpen(false); }} className="p-4 bg-cyan-500 text-black rounded-xl hover:bg-cyan-400 transition-colors"><CheckCircle size={18} /></button>
                                                                <button onClick={() => setIsAddingNew(false)} className="p-4 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-colors"><X size={18} /></button>
                                                            </div>
                                                        )}

                                                        <AnimatePresence>
                                                            {isDropdownOpen && !isAddingNew && (
                                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute w-full top-full left-0 mt-3 bg-[#0d1326] border border-white/20 rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-[100]">
                                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                                        {subjects.map(s => (
                                                                            <button key={s} onClick={() => { setSelectedSubject(s); setIsDropdownOpen(false); }} className={`w-full text-left px-5 py-4 text-sm hover:bg-white/10 border-b border-white/5 last:border-0 transition-colors ${selectedSubject === s ? 'bg-cyan-500/15 text-cyan-400 font-bold' : 'text-gray-300'}`}>
                                                                                {s}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                    <div className="border-t border-white/20 p-2 bg-[#0a0f1c]">
                                                                        <button onClick={() => setIsAddingNew(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm font-bold hover:bg-cyan-500/20 transition-colors">
                                                                            <Plus size={16} /> Yeni Çalışma Konusu Ekle
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={startTimer}
                                            className={`group relative w-64 py-5 rounded-3xl font-black text-xl text-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 ${bgColors[mode.color]} ${glowColors[mode.color]} flex items-center justify-center gap-3 overflow-hidden shadow-2xl`}
                                        >
                                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                                            <span className="relative z-10 flex items-center gap-2">
                                                <Play size={24} fill="currentColor" /> Başla
                                            </span>
                                        </button>
                                    </motion.div>
                                ) : (
                                    /* --- ACTIVE VIEW --- */
                                    <motion.div
                                        key="active-view"
                                        initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="w-full flex flex-col items-center"
                                    >
                                        {mode.id === 'FOCUS' && activeSubjectName && (
                                            <div className="mb-8 px-6 py-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                                                <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm">{activeSubjectName}</span>
                                            </div>
                                        )}

                                        <div className="relative w-64 h-64 md:w-[26rem] md:h-[26rem] flex items-center justify-center mb-12">
                                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                                <circle cx="50%" cy="50%" r="48%" className="stroke-white/5 fill-none" strokeWidth="6" />
                                                <circle
                                                    cx="50%" cy="50%" r="48%"
                                                    className={`${textColors[mode.color].replace('text-', 'stroke-')} fill-none transition-all duration-1000 ease-linear drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}
                                                    strokeWidth="8" strokeDasharray="300%" strokeDashoffset={`${300 - (300 * progress) / 100}%`} strokeLinecap="round"
                                                />
                                            </svg>

                                            <div className="flex flex-col items-center">
                                                <span className={`text-7xl md:text-9xl font-black tabular-nums tracking-tighter ${textColors[mode.color]} drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]`}>
                                                    {formatTime(timeLeft)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 md:gap-8">
                                            <button onClick={resetTimer} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all hover:rotate-180 duration-500 hover:shadow-lg tooltip group relative">
                                                <RotateCcw size={24} />
                                                <span className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap bg-black/80 px-3 py-1.5 rounded-lg">Sıfırla</span>
                                            </button>

                                            <button onClick={toggleTimer} className={`w-28 h-28 rounded-full flex items-center justify-center text-black shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${bgColors[mode.color]} ${glowColors[mode.color]} relative group`}>
                                                <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-out"></div>
                                                <span className="relative z-10">
                                                    {isActive ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                                                </span>
                                            </button>

                                            <button onClick={endSessionEarly} className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] group relative">
                                                <Square size={20} fill="currentColor" />
                                                <span className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap bg-black/80 px-3 py-1.5 rounded-lg z-50">Erken Bitir</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* ===== HISTORY DASHBOARD VIEW ===== */}
                    {viewMode === 'HISTORY' && (
                        <motion.div
                            key="history-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full flex flex-col"
                        >
                            <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2 flex items-center justify-center md:justify-start gap-4">
                                        <BarChart className="text-cyan-400 w-10 h-10" />
                                        Öğrenme Analitiği
                                    </h1>
                                    <p className="text-gray-400 font-medium">Odaklandığın tüm konuların ve pomodoro istatistiklerin.</p>
                                </div>
                                <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex gap-6 text-sm font-bold">
                                    <div className="flex flex-col items-center md:items-start"><span className="text-gray-500 uppercase tracking-widest text-[10px]">Toplam Konu</span><span className="text-xl text-white">{groupedHistory.length}</span></div>
                                    <div className="w-px bg-white/10"></div>
                                    <div className="flex flex-col items-center md:items-start"><span className="text-gray-500 uppercase tracking-widest text-[10px]">Top. Saat</span><span className="text-xl text-cyan-400">{formatDuration(groupedHistory.reduce((acc, curr) => acc + curr.totalMinutes, 0))}</span></div>
                                </div>
                            </div>

                            {groupedHistory.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-600 bg-white/[0.02] border border-white/5 rounded-3xl">
                                    <History size={64} className="mb-6 opacity-20" />
                                    <p className="text-lg font-bold tracking-widest uppercase">Henüz kaydedilmiş bir çalışma yok.</p>
                                    <p className="mt-2">Pomodoro sayfasından bir çalışmayı tamamlayıp veya erken bitirip kaydedebilirsin.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {groupedHistory.map((group) => {
                                        const isExpanded = expandedSubject === group.subject;
                                        return (
                                            <div
                                                key={group.subject}
                                                className={`flex flex-col bg-[#0a0f1c]/80 border transition-all duration-300 backdrop-blur-md overflow-hidden rounded-3xl ${isExpanded ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.15)] col-span-1 md:col-span-2 lg:col-span-3' : 'border-white/10 hover:border-white/30 hover:bg-[#111827]'}`}
                                            >
                                                {/* Card Header (Always visible) */}
                                                <button
                                                    onClick={() => toggleSubjectExpand(group.subject)}
                                                    className="w-full text-left p-6 md:p-8 flex items-center justify-between group/card relative overflow-hidden focus:outline-none"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.03] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>

                                                    <div className="flex items-center gap-5 relative z-10">
                                                        <div className={`p-4 rounded-2xl border transition-colors ${isExpanded ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-white/5 border-white/10 text-gray-400 group-hover/card:bg-white/10'}`}>
                                                            <BookOpen size={24} />
                                                        </div>
                                                        <div>
                                                            <h3 className={`text-xl font-bold tracking-tight mb-1 transition-colors ${isExpanded ? 'text-cyan-400' : 'text-gray-100'}`}>{group.subject}</h3>
                                                            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                                                                <span className="flex items-center gap-1.5"><Timer size={14} /> {formatDuration(group.totalMinutes)}</span>
                                                                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                                <span className="flex items-center gap-1.5"><CheckCircle size={14} /> {group.totalSessions} Seans</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 relative z-10">
                                                        <div className="hidden md:flex flex-col items-end mr-4">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">Son Çalışma</span>
                                                            <span className="text-xs text-gray-400 font-medium">{new Date(group.lastActive).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                                        </div>
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${isExpanded ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] rotate-90' : 'bg-white/5 border-white/10 text-gray-400 group-hover/card:border-white/30 group-hover/card:text-white'}`}>
                                                            <ChevronRight size={20} />
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Expanded Content (Accordion) */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                            className="border-t border-white/10 bg-black/40"
                                                        >
                                                            <div className="p-6 md:p-8">
                                                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500 mb-6 flex items-center gap-3">
                                                                    <div className="h-px bg-cyan-500/20 flex-1"></div>
                                                                    Pomodoro Kayıtları
                                                                    <div className="h-px bg-cyan-500/20 flex-1"></div>
                                                                </h4>

                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                    {group.sessions.map((session, i) => (
                                                                        <div key={session.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex flex-col group/log">
                                                                            <div className="flex justify-between items-start mb-4">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black text-xs">
                                                                                        #{group.sessions.length - i}
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="text-sm font-bold text-gray-200">{session.duration_minutes} Dakika</span>
                                                                                        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-gray-500 mt-1">
                                                                                            <Clock size={10} />
                                                                                            {new Date(session.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            {session.notes ? (
                                                                                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-gray-300 font-medium leading-relaxed">
                                                                                    <span className="text-gray-600 mr-2">"</span>{session.notes}<span className="text-gray-600 ml-2">"</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="p-3 rounded-xl border border-dashed border-white/10 text-xs text-gray-600 font-medium italic opacity-50 flex items-center gap-2">
                                                                                    <BookOpen size={14} /> Not girilmemiş
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Session Completion Modal (Kept unchanged but fully functioning for saving) */}
            <AnimatePresence>
                {showSessionModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setShowSessionModal(false)}>
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-[#0f172a] border border-cyan-500/30 shadow-[0_0_80px_rgba(6,182,212,0.2)] rounded-3xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                            {/* Decorative header */}
                            <div className="h-28 bg-gradient-to-br from-cyan-600/30 to-emerald-600/10 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-black/20"></div>
                                <CheckCircle className="text-cyan-400 z-10 w-14 h-14 drop-shadow-lg" />
                            </div>

                            <div className="p-8">
                                <h3 className="text-2xl font-black text-center mb-2">Çalışma Özeti 🚀</h3>
                                <p className="text-sm text-gray-400 text-center mb-8 bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                                    <strong className="text-white text-base">
                                        {Math.max(1, Math.ceil(((mode.id === 'FOCUS' ? focusMinutes : breakMinutes) * 60 - timeLeft) / 60))} dakika
                                    </strong> boyunca odaklandın.<br />
                                    {(activeSubjectName) && <span className="block mt-2 pt-2 border-t border-white/5">Konu: <strong className="text-cyan-400 text-base">{activeSubjectName}</strong></span>}
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Çalışma Özeti / Notlar (Opsiyonel)</label>
                                        <textarea
                                            placeholder="Neler yaptın? Nerede kaldın? vs..."
                                            value={sessionNotes}
                                            onChange={e => setSessionNotes(e.target.value)}
                                            rows={4}
                                            className="w-full bg-[#111827] border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none placeholder-gray-600 shadow-inner"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => { setShowSessionModal(false); resetTimer(); }} className="flex-1 py-3.5 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-gray-400 transition-colors border border-white/5">İptal / Geç</button>
                                        <button onClick={saveSession} disabled={isSaving || (!selectedSubject && !newSubject)} className={`flex-1 py-3.5 rounded-xl font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 ${(isSaving || (!selectedSubject && !newSubject)) ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_20px_rgba(6,182,212,0.4)]'}`}>
                                            {isSaving ? <RotateCcw className="animate-spin" size={18} /> : <><Save size={18} /> Kaydet</>}
                                        </button>
                                    </div>
                                    {(!selectedSubject && !newSubject) && <p className="text-[10px] text-red-400 text-center uppercase tracking-widest mt-2 flex items-center justify-center gap-1"><X size={10} /> Kaydetmek için listeden bir konu veya aktivite seçmelisin.</p>}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
