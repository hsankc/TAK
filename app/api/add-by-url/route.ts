import { NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scrapers/generic';
import { supabase } from '@/lib/supabase';
import { detectCategory, detectTags, calculateRelevance } from '@/lib/scrapers/utils';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL required' }, { status: 400 });
        }

        let scrapedData = await scrapeUrl(url);

        const source = new URL(url).hostname.replace('www.', '').split('.')[0];

        if (!scrapedData) {
            // Fallback for when scraping fails (e.g. 403 Forbidden from Indeed/LinkedIn)
            scrapedData = {
                title: `Yeni İlan (${source})`,
                url,
                deadline: null,
                description: 'Detaylar için linke tıklayın'
            };
        }

        const opportunity = {
            ...scrapedData,
            source: source,
            category: detectCategory(scrapedData.title),
            tags: detectTags(scrapedData.title),
            relevance_score: calculateRelevance(scrapedData.title),
            location_type: 'TR' as const, // Default to TR since user mostly uses TR sources
            status: 'wishlist',
            deadline: scrapedData.deadline ? scrapedData.deadline.toISOString() : null,
            scraped_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('opportunities')
            .upsert(opportunity, { onConflict: 'url' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Add by URL error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
