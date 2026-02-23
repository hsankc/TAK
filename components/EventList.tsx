'use client';
import { motion } from 'framer-motion';
import EventCard from './EventCard';

interface EventListProps {
    events: any[];
    onStatusChange: (id: string, newStatus: string) => void;
    loading: boolean;
    onCardClick?: (event: any) => void;
}

export default function EventList({ events, onStatusChange, loading, onCardClick }: EventListProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-blue-500/50">
                <div className="w-10 h-10 border-4 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-xs font-bold tracking-widest uppercase">Veriler Yükleniyor...</p>
            </div>
        );
    }

    const listVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <motion.div
            variants={listVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {events.map((event, index) => (
                <div key={event.id} onClick={() => onCardClick?.(event)}>
                    <EventCard
                        index={index}
                        id={event.id}
                        title={event.title}
                        url={event.url}
                        deadline={event.deadline}
                        category={event.category}
                        organizer={event.source || 'Unknown'}
                        type={event.location_type || 'TR'}
                        status={event.status}
                        onStatusChange={onStatusChange}
                    />
                </div>
            ))}
        </motion.div>
    );
}
