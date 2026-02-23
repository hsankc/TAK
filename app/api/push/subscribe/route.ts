import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const subscription = await req.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
        }

        // JSON formatındaki "keys" objesinden p256dh ve auth değerlerini çıkaralım
        const keys = subscription.keys || {};

        // Veritabanına kaydet
        const { data, error } = await supabase
            .from('push_subscriptions')
            .upsert({
                endpoint: subscription.endpoint,
                p256dh: keys.p256dh || '',
                auth: keys.auth || '',
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Supabase Error saving push subscription:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Subscription saved.' });
    } catch (error) {
        console.error('Error in /api/push/subscribe:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
