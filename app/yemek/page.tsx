'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, RefreshCw, CreditCard, Calendar, Soup, Beef, Salad, IceCreamCone } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MealFood {
    name: string;
    calories: number | null;
}

interface MealDay {
    date: string;
    startTime: string;
    endTime: string;
    foods: MealFood[];
}

const foodIcons = [
    <Soup size={16} className="text-amber-400" />,
    <Beef size={16} className="text-red-400" />,
    <Salad size={16} className="text-emerald-400" />,
    <IceCreamCone size={16} className="text-pink-400" />,
];

const foodLabels = ['Çorba', 'Ana Yemek', 'Yan Yemek', 'Tatlı / İçecek'];

export default function YemekPage() {
    const [meals, setMeals] = useState<MealDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { fetchMeals(); }, []);

    async function fetchMeals() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/yemek');
            const data = await res.json();
            if (data.success) {
                // Filter to show only today and future meals
                const today = startOfDay(new Date());
                const upcoming = data.meals.filter((m: MealDay) =>
                    new Date(m.date) >= today
                );
                setMeals(upcoming.slice(0, 14)); // Next 2 weeks
            } else {
                setError(data.error || 'Veri alınamadı');
            }
        } catch (err) {
            setError('Sunucu bağlantı hatası');
        } finally {
            setLoading(false);
        }
    }

    function getDayLabel(dateStr: string) {
        const date = parseISO(dateStr);
        if (isToday(date)) return '📌 BUGÜN';
        if (isTomorrow(date)) return 'YARIN';
        return format(date, 'EEEE', { locale: tr }).toUpperCase();
    }

    function getDayStyle(dateStr: string) {
        const date = parseISO(dateStr);
        if (isToday(date)) return 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20';
        if (isTomorrow(date)) return 'border-cyan-500/30 bg-cyan-500/5';
        return 'border-white/5 bg-white/[0.02]';
    }

    return (
        <div className="min-h-screen bg-[#030712] text-white p-4 md:p-6 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto py-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <UtensilsCrossed className="text-amber-500 w-5 h-5 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-[0.4em] text-amber-500 uppercase">ÇOMÜ Yemekhane</span>
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black bg-gradient-to-r from-white via-white/80 to-white/20 bg-clip-text text-transparent tracking-tighter">
                            Yemek Menüsü
                        </h1>
                    </motion.div>

                    <div className="flex gap-3">
                        <button onClick={fetchMeals}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                            title="Yenile">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <a href="https://odeme.comu.edu.tr" target="_blank" rel="noopener noreferrer"
                            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
                            <CreditCard size={14} /> ÇOMÜ KART YÜKLE
                        </a>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 text-amber-500/50">
                        <div className="w-10 h-10 border-4 border-t-amber-500 rounded-full animate-spin"></div>
                        <p className="mt-4 text-xs font-bold tracking-widest uppercase">Menü Yükleniyor...</p>
                    </div>
                ) : error ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-40 text-red-500/50">
                        <UtensilsCrossed size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium">{error}</p>
                        <button onClick={fetchMeals} className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white transition">
                            Tekrar Dene
                        </button>
                    </motion.div>
                ) : meals.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-40 text-gray-600">
                        <UtensilsCrossed size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-medium uppercase tracking-widest">Menü bulunamadı</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {meals.map((meal, idx) => (
                            <motion.div
                                key={meal.date}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`rounded-2xl border p-5 transition-all hover:border-white/20 ${getDayStyle(meal.date)}`}
                            >
                                {/* Day Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <span className={`text-xs font-black uppercase tracking-widest ${isToday(parseISO(meal.date)) ? 'text-amber-400' : 'text-gray-400'
                                            }`}>
                                            {getDayLabel(meal.date)}
                                        </span>
                                        <p className="text-gray-500 text-[10px] mt-0.5">
                                            {format(parseISO(meal.date), 'dd MMMM yyyy', { locale: tr })}
                                        </p>
                                    </div>
                                    <Calendar size={16} className="text-gray-600" />
                                </div>

                                {/* Foods */}
                                <div className="space-y-2.5">
                                    {meal.foods.map((food, foodIdx) => (
                                        <div key={foodIdx} className="flex items-center gap-3 group">
                                            <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/20 transition-all">
                                                {foodIcons[foodIdx] || <UtensilsCrossed size={16} className="text-gray-400" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-white font-medium group-hover:text-amber-300 transition-colors">{food.name}</p>
                                                <span className="text-[9px] text-gray-600 uppercase tracking-widest">{foodLabels[foodIdx] || `Ek ${foodIdx + 1}`}</span>
                                            </div>
                                            {food.calories && (
                                                <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">
                                                    {food.calories} kcal
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Total Calories */}
                                {meal.foods.some(f => f.calories) && (
                                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                                        <span className="text-[10px] font-bold text-gray-500">
                                            Toplam: {meal.foods.reduce((sum, f) => sum + (f.calories || 0), 0)} kcal
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
