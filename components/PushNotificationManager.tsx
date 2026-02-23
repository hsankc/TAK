'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none',
            });
            const sub = await registration.pushManager.getSubscription();
            setSubscription(sub);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    async function subscribeToPush() {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            // Get the VAPID public key from env
            const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!publicVapidKey) {
                console.error("No VAPID public key found in environment");
                setLoading(false);
                return;
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(publicVapidKey),
            });

            setSubscription(sub);

            // Send to backend to save in Supabase
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sub),
            });

        } catch (error) {
            console.error('Error subscribing to push notifications', error);
        } finally {
            setLoading(false);
        }
    }

    if (!isSupported) {
        return null; // Don't show anything if browser doesn't support push
    }

    return (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-50">
            <AnimatePresence>
                {!subscription && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50 }}
                        className="bg-gray-900 border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm backdrop-blur-xl"
                    >
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-full">
                            <Bell className="w-6 h-6 animate-bounce" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-white">Bildirimleri Aç</h4>
                            <p className="text-xs text-gray-400 mt-1">Dersler ve son tarihler yaklaşınca hatırlatalım.</p>
                        </div>
                        <button
                            onClick={subscribeToPush}
                            disabled={loading}
                            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'İzin Ver'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
