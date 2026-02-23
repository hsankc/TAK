import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ExternalLink, Heart, CheckCircle } from 'lucide-react';

interface OpportunityCardProps {
  id: string;
  title: string;
  url: string;
  deadline?: string | null;
  category: string;
  source: string;
  status: string;
  onStatusChange: (id: string, newStatus: string) => void;
}

export default function OpportunityCard({ 
  id, title, url, deadline, category, source, status, onStatusChange 
}: OpportunityCardProps) {
  const categoryColors: Record<string, string> = {
    hackathon: 'bg-purple-100 text-purple-800',
    scholarship: 'bg-blue-100 text-blue-800',
    education: 'bg-green-100 text-green-800',
    competition: 'bg-orange-100 text-orange-800'
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg flex-1">{title}</h3>
        <span className={`text-xs px-2 py-1 rounded ml-2 ${categoryColors[category] || 'bg-gray-100'}`}>
          {category}
        </span>
      </div>
      
      <p className="text-sm text-gray-500 mb-3">Kaynak: {source}</p>
      
      {deadline && (
        <p className="text-sm text-red-600 mb-3">
          Son Başvuru: {formatDistanceToNow(new Date(deadline), { addSuffix: true, locale: tr })}
        </p>
      )}
      
      <div className="flex gap-2 flex-wrap">
        {status !== 'wishlist' && (
          <button 
            onClick={() => onStatusChange(id, 'wishlist')}
            className="flex items-center gap-1 text-sm px-3 py-1 bg-pink-100 rounded hover:bg-pink-200 transition"
          >
            <Heart size={16} /> İstek Listesi
          </button>
        )}
        
        {status !== 'applied' && (
          <button 
            onClick={() => onStatusChange(id, 'applied')}
            className="flex items-center gap-1 text-sm px-3 py-1 bg-green-100 rounded hover:bg-green-200 transition"
          >
            <CheckCircle size={16} /> Başvurdum
          </button>
        )}
        
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition"
        >
          <ExternalLink size={16} /> Aç
        </a>
      </div>
    </div>
  );
}
