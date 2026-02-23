import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

interface DeadlineBadgeProps {
    deadline: string | null | undefined; // ISO string (Supabase'den gelir)
}

export function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
    if (!deadline) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-500/10 border border-gray-500/20 text-[10px] font-bold text-gray-400">
                <Calendar size={10} />
                <span>TARİH BELİRTİLMEMİŞ</span>
            </div>
        );
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const isExpired = deadlineDate < now;

    // Kalan gün hesabı
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const formattedDate = deadlineDate.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    if (isExpired) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-500/10 border border-gray-500/20 text-[10px] font-bold text-gray-400 line-through decoration-gray-400">
                <AlertCircle size={10} />
                <span>SONA ERDİ · {formattedDate}</span>
            </div>
        );
    }

    // Son 7 gün — kritik (kırmızı)
    if (diffDays <= 7) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-bold text-red-400 animate-pulse">
                <Clock size={10} />
                <span>
                    SON: {formattedDate}
                    {diffDays > 0 ? ` · ${diffDays} GÜN KALDI` : ' · BUGÜN!'}
                </span>
            </div>
        );
    }

    // Normal durum (turuncu/sarı)
    if (diffDays <= 30) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-400">
                <Calendar size={10} />
                <span>SON: {formattedDate} · {diffDays} GÜN</span>
            </div>
        );
    }

    // Uzak tarih (mavi/yeşil)
    return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
            <Calendar size={10} />
            <span>SON: {formattedDate}</span>
        </div>
    );
}
