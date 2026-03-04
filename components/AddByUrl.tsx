'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link as LinkIcon, Plus, Loader2, Edit3, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AddByUrl({ onAdded }: { onAdded: () => void }) {
    const [mode, setMode] = useState<'link' | 'manual'>('link');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Manual Form States
    const [title, setTitle] = useState('');
    const [organizer, setOrganizer] = useState('');
    const [category, setCategory] = useState('etkinlik');
    const [type, setType] = useState('TR');
    const [deadline, setDeadline] = useState('');

    const handleLinkAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setLoading(true);
        setMessage('');

        try {
            const res = await fetch('/api/add-by-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await res.json();

            if (data.success) {
                setUrl('');
                setMessage('✅ Başarıyla eklendi!');
                onAdded();
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('❌ Hata: ' + data.error);
            }
        } catch (err) {
            setMessage('❌ Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleManualAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return;

        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.from('opportunities').insert([{
                title,
                url: url || '#',
                source: organizer || 'Kendi Eklediğim',
                category,
                location_type: type,
                deadline: deadline || null,
                status: 'wishlist'
            }]);

            if (error) throw error;

            setTitle('');
            setOrganizer('');
            setUrl('');
            setDeadline('');
            setMessage('✅ Manuel kayıt başarıyla eklendi!');
            setMode('link');
            onAdded();
            setTimeout(() => setMessage(''), 3000);

        } catch (error: any) {
            console.error(error);
            setMessage('❌ Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative group w-full">
            <div className={`absolute -inset-1 rounded-2xl blur opacity-25 transition duration-1000 ${mode === 'link' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 group-hover:opacity-50' : 'bg-gradient-to-r from-purple-500 to-pink-600 opacity-50'}`}></div>
            <div className="relative bg-gray-950/40 backdrop-blur-xl rounded-2xl border border-white/5 flex flex-col overflow-hidden">

                {/* Mode Switcher Tabs */}
                <div className="flex border-b border-white/5 bg-white/[0.02]">
                    <button
                        onClick={() => setMode('link')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${mode === 'link' ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <LinkIcon size={12} /> Link ile Şipşak Ekle
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all gap-2 flex items-center justify-center ${mode === 'manual' ? 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <Edit3 size={12} /> Manuel Ekle
                    </button>
                </div>

                <div className="p-4">
                    <AnimatePresence mode="wait">
                        {mode === 'link' ? (
                            <motion.form
                                key="link-form"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onSubmit={handleLinkAdd}
                                className="flex gap-2"
                            >
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="İlan linkini buraya yapıştır..."
                                    className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    EKLE
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="manual-form"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onSubmit={handleManualAdd}
                                className="flex flex-col gap-3"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Etkinlik / Eğitim Adı *"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all md:col-span-2"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={organizer}
                                        onChange={(e) => setOrganizer(e.target.value)}
                                        placeholder="Düzenleyen Kurum"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="Etkinlik Linki (Opsiyonel)"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="etkinlik" className="bg-gray-900">Etkinlik</option>
                                        <option value="bootcamp" className="bg-gray-900">Eğitim</option>
                                        <option value="hackathon" className="bg-gray-900">Hackathon</option>
                                        <option value="is_staj" className="bg-gray-900">Staj / İş</option>
                                    </select>
                                    <select
                                        value={type}
                                        onChange={e => setType(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="TR" className="bg-gray-900">Türkiye İçi (Fiziksel/Online)</option>
                                        <option value="Global" className="bg-gray-900">Global (Yurtdışı/Remote)</option>
                                    </select>
                                    <input
                                        type="date"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !title}
                                    className="w-full mt-1 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    MANUEL EKLE
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {message && (
                        <motion.p
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`text-xs font-bold mt-3 px-2 text-center ${message.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                            {message}
                        </motion.p>
                    )}
                </div>
            </div>
        </div>
    );
}
