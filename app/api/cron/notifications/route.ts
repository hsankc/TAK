export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import webpush from 'web-push';

webpush.setVapidDetails(
    'mailto:admin@takapp.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export async function GET(request: Request) {
    try {
        // 1. Aboneleri getir
        const { data: subscriptions, error: subError } = await supabase.from('push_subscriptions').select('*');
        if (subError || !subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ message: 'No active subscriptions found.' });
        }

        const messagesToSend: any[] = [];
        const now = new Date();

        // --- GÖREV 1: YAKLAŞAN DERSLER ---
        // JavaScript getDay() pazar=0, pazartesi=1. Supabase'deki day_of_week nasıl tutuluyor kontrol etmeli ama biz standart 0-6 sayıyoruz.
        const currentDay = now.getDay();
        const { data: todayClasses } = await supabase
            .from('schedule')
            .select('subject, start_time, location')
            .eq('day_of_week', currentDay);

        if (todayClasses) {
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            todayClasses.forEach(lesson => {
                // start_time formatı "14:30:00" string'dir
                const [hours, minutes] = lesson.start_time.split(':').map(Number);
                const startMinutes = hours * 60 + minutes;

                const diff = startMinutes - currentMinutes;
                // Eğer derse 10 ile 20 dakika arasında kaldıysa (15dk warning)
                if (diff > 0 && diff <= 30) {
                    messagesToSend.push({
                        title: '⏳ Ders Başlıyor!',
                        body: `${lesson.subject} dersi yaklaşıyor. (${lesson.start_time}) - Yer: ${lesson.location || 'Bilinmiyor'}`,
                        url: '/schedule'
                    });
                }
            });
        }

        // --- GÖREV 2: YAKLAŞAN FIRSAT SON TARİHLERİ ---
        // Son teslim tarihi önümüzdeki 3 gün içinde olan aktif fırsatları bul
        const threeDaysLater = new Date();
        threeDaysLater.setDate(threeDaysLater.getDate() + 3);

        const { data: urgentOps } = await supabase
            .from('opportunities')
            .select('title, deadline')
            .in('status', ['new', 'wishlist'])
            .lte('deadline', threeDaysLater.toISOString())
            .gte('deadline', now.toISOString());

        if (urgentOps) {
            urgentOps.forEach(op => {
                messagesToSend.push({
                    title: '🔥 Fırsat Kaçıyor!',
                    body: `Son başvuru yaklaştı: ${op.title}`,
                    url: '/opportunities'
                });
            });
        }

        // --- BİLDİRİMLERİ GÖNDER ---
        let sentCount = 0;

        // Eğer gönderecek hiçbir mesaj yoksa çık
        if (messagesToSend.length === 0) {
            return NextResponse.json({ message: 'No notifications to send right now.' });
        }

        // Tüm abonelere, biriken tüm mesajları atıyoruz
        for (const sub of subscriptions) {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            for (const msg of messagesToSend) {
                try {
                    await webpush.sendNotification(pushSubscription, JSON.stringify(msg));
                    sentCount++;
                } catch (err: any) {
                    console.error('Error sending push:', err);
                    // Eğer abonesi iptal olmuşsa DB'den silinebilir
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, sent: sentCount, messages: messagesToSend });

    } catch (error: any) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
