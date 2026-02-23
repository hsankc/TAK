'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Plus, Trash2, ExternalLink, StickyNote, Link2, Youtube, FileText, Check, X as XIcon } from 'lucide-react';

interface Resource {
    id: string;
    type: 'note' | 'link' | 'video' | 'drive';
    title: string;
    content: string;
    url?: string;
}

interface WeekData {
    [week: number]: boolean | null; // true = attended, false = missed, null = not marked
}

function getStorageKey(subject: string, type: string) {
    return `tak_course_${subject}_${type}`;
}

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const subject = decodeURIComponent(params.subject as string);

    const [resources, setResources] = useState<Resource[]>([]);
    const [attendance, setAttendance] = useState<WeekData>({});
    const [showAddResource, setShowAddResource] = useState(false);
    const [newResource, setNewResource] = useState({ type: 'note' as Resource['type'], title: '', content: '', url: '' });

    // Load from localStorage
    useEffect(() => {
        const savedResources = localStorage.getItem(getStorageKey(subject, 'resources'));
        if (savedResources) setResources(JSON.parse(savedResources));
        const savedAttendance = localStorage.getItem(getStorageKey(subject, 'attendance'));
        if (savedAttendance) setAttendance(JSON.parse(savedAttendance));
    }, [subject]);

    // Save helpers
    function saveResources(data: Resource[]) {
        setResources(data);
        localStorage.setItem(getStorageKey(subject, 'resources'), JSON.stringify(data));
    }
    function saveAttendance(data: WeekData) {
        setAttendance(data);
        localStorage.setItem(getStorageKey(subject, 'attendance'), JSON.stringify(data));
    }

    // Resources
    function addResource(e: React.FormEvent) {
        e.preventDefault();
        const resource: Resource = {
            id: Date.now().toString(),
            type: newResource.type,
            title: newResource.title,
            content: newResource.content,
            url: newResource.url || undefined,
        };
        saveResources([...resources, resource]);
        setNewResource({ type: 'note', title: '', content: '', url: '' });
        setShowAddResource(false);
    }
    function deleteResource(id: string) {
        saveResources(resources.filter(r => r.id !== id));
    }

    // Attendance
    const totalWeeks = 14;
    const maxAbsences = 4;
    const absences = Object.values(attendance).filter(v => v === false).length;
    const attended = Object.values(attendance).filter(v => v === true).length;
    const remaining = maxAbsences - absences;

    function toggleWeek(week: number) {
        const current = attendance[week];
        let next: boolean | null;
        if (current === null || current === undefined) next = true;      // unmarked → attended
        else if (current === true) next = false;                         // attended → missed
        else next = null;                                                 // missed → unmarked
        saveAttendance({ ...attendance, [week]: next });
    }

    const typeIcons: Record<string, any> = {
        note: <StickyNote size={16} />,
        link: <Link2 size={16} />,
        video: <Youtube size={16} />,
        drive: <FileText size={16} />,
    };
    const typeLabels: Record<string, string> = {
        note: 'Not',
        link: 'Site Linki',
        video: 'YouTube',
        drive: 'Drive Linki',
    };
    const typeColors: Record<string, string> = {
        note: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
        link: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
        video: 'text-red-400 border-red-500/30 bg-red-500/5',
        drive: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white p-6 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto py-10">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                    <button onClick={() => router.push('/schedule')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm">
                        <ArrowLeft size={16} /> Ders Programına Dön
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="text-indigo-500 w-5 h-5" />
                        <span className="text-[10px] font-bold tracking-[0.4em] text-indigo-500 uppercase">Course Details</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-white via-white/80 to-white/20 bg-clip-text text-transparent tracking-tighter">
                        {subject}
                    </h1>
                </motion.div>

                {/* ═══ ATTENDANCE TRACKER ═══ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-white">📊 Devamsızlık Takibi</h2>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-emerald-400">✅ Katıldım: {attended}</span>
                            <span className="text-red-400">❌ Katılmadım: {absences}/{maxAbsences}</span>
                            <span className={`font-bold ${remaining <= 1 ? 'text-red-400 animate-pulse' : remaining <= 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                Kalan Hak: {remaining}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/5 rounded-full mb-4 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(absences / maxAbsences) * 100}%`,
                                backgroundColor: remaining <= 1 ? '#ef4444' : remaining <= 2 ? '#f59e0b' : '#10b981'
                            }}
                        />
                    </div>

                    {/* 14 Week Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => {
                            const status = attendance[week];
                            return (
                                <button
                                    key={week}
                                    onClick={() => toggleWeek(week)}
                                    className={`relative p-3 rounded-xl border text-center transition-all duration-300 hover:scale-105 ${status === true
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                            : status === false
                                                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                                : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/20'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-widest block">Hafta</span>
                                    <span className="text-xl font-black">{week}</span>
                                    <div className="mt-1">
                                        {status === true && <Check size={14} className="mx-auto text-emerald-400" />}
                                        {status === false && <XIcon size={14} className="mx-auto text-red-400" />}
                                        {(status === null || status === undefined) && <span className="text-[10px] text-gray-600">—</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-[10px] text-gray-600 mt-3 text-center">Tıkla: işaretsiz → ✅ katıldım → ❌ katılmadım → işaretsiz</p>
                </motion.div>

                {/* ═══ RESOURCES ═══ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg text-white">📚 Notlar & Kaynaklar</h2>
                        <button onClick={() => setShowAddResource(true)}
                            className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
                            <Plus size={12} /> EKLE
                        </button>
                    </div>

                    {/* Resources List */}
                    {resources.length === 0 ? (
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-12 text-center text-gray-600">
                            <StickyNote size={32} className="mx-auto mb-3 opacity-20" />
                            <p className="text-xs uppercase tracking-widest">Henüz içerik eklenmemiş</p>
                            <p className="text-[10px] mt-1">Not, link, YouTube videosu veya Drive linki ekleyebilirsin.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {resources.map(r => (
                                <div key={r.id} className={`p-4 rounded-2xl border-l-4 ${typeColors[r.type]} group transition-all hover:bg-white/[0.03]`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="mt-0.5">{typeIcons[r.type]}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-white text-sm">{r.title}</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-500">
                                                        {typeLabels[r.type]}
                                                    </span>
                                                </div>
                                                {r.content && <p className="text-xs text-gray-400 whitespace-pre-wrap">{r.content}</p>}
                                                {r.url && (
                                                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                                                        <ExternalLink size={10} /> {r.url.length > 60 ? r.url.substring(0, 60) + '...' : r.url}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => deleteResource(r.id)}
                                            className="opacity-0 group-hover:opacity-100 transition p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/30">
                                            <Trash2 size={14} className="text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Add Resource Modal */}
            {showAddResource && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddResource(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-black text-white mb-4">Yeni İçerik Ekle</h2>
                        <form onSubmit={addResource} className="space-y-4">
                            {/* Type */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tür</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['note', 'link', 'video', 'drive'] as const).map(t => (
                                        <button key={t} type="button" onClick={() => setNewResource({ ...newResource, type: t })}
                                            className={`p-2 rounded-xl border text-center text-[10px] font-bold uppercase transition-all ${newResource.type === t ? typeColors[t] : 'bg-white/5 border-white/10 text-gray-500'
                                                }`}>
                                            <div className="flex flex-col items-center gap-1">{typeIcons[t]}<span>{typeLabels[t]}</span></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Başlık</label>
                                <input type="text" value={newResource.title} onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none placeholder:text-gray-600"
                                    placeholder="Ders notu, kaynak adı..." required />
                            </div>
                            {/* URL (for link, video, drive) */}
                            {newResource.type !== 'note' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">URL</label>
                                    <input type="url" value={newResource.url} onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none placeholder:text-gray-600"
                                        placeholder={newResource.type === 'video' ? 'YouTube linki...' : newResource.type === 'drive' ? 'Drive linki...' : 'https://...'} required />
                                </div>
                            )}
                            {/* Content / Note */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                    {newResource.type === 'note' ? 'Not İçeriği' : 'Açıklama (opsiyonel)'}
                                </label>
                                <textarea value={newResource.content} onChange={e => setNewResource({ ...newResource, content: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none placeholder:text-gray-600 resize-none h-24"
                                    placeholder="Not yaz..." required={newResource.type === 'note'} />
                            </div>
                            {/* Buttons */}
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 bg-indigo-500 text-black py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-400 transition">Ekle</button>
                                <button type="button" onClick={() => setShowAddResource(false)}
                                    className="flex-1 bg-white/5 border border-white/10 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition">İptal</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
