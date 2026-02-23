import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET() {
    try {
        // Fetch the page HTML
        const { data: html } = await axios.get('https://yemek.comu.edu.tr/', {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Extract the JSON data from inline script
        // The data is embedded in a script tag as response.data = [...]
        const $ = cheerio.load(html);
        let mealData: any[] = [];

        $('script:not([src])').each((_, el) => {
            const scriptContent = $(el).html() || '';

            // Look for the data pattern - it's usually in a variable assignment
            // Try to find JSON array with foodName and startDate
            const patterns = [
                /var\s+\w+\s*=\s*(\[[\s\S]*?\]);/,
                /data\s*[:=]\s*(\[[\s\S]*?\]);/,
                /response\.data\s*=\s*(\[[\s\S]*?\]);/,
                /events\s*[:=]\s*(\[[\s\S]*?\]);/,
            ];

            for (const pattern of patterns) {
                const match = scriptContent.match(pattern);
                if (match) {
                    try {
                        const parsed = JSON.parse(match[1]);
                        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].foodName) {
                            mealData = parsed;
                            return false; // break each
                        }
                    } catch (e) {
                        // Not valid JSON, try next pattern
                    }
                }
            }

            // Alternative: look for addCalendarEvent calls or similar
            const eventMatches = scriptContent.matchAll(/\{[^}]*foodName[^}]*\}/g);
            for (const m of eventMatches) {
                try {
                    const obj = JSON.parse(m[0]);
                    if (obj.foodName) mealData.push(obj);
                } catch (e) { }
            }
        });

        // If we couldn't extract from scripts, try to parse from visible content
        if (mealData.length === 0) {
            // Fallback: parse the calendar event elements
            const events: any[] = [];
            $('.event-container, .calendar-event, [data-event]').each((_, el) => {
                const text = $(el).text().trim();
                if (text) {
                    events.push({ foodName: [text], startDate: new Date().toISOString() });
                }
            });
            mealData = events;
        }

        // Format the data
        const meals = mealData.map((item: any) => {
            const foods = Array.isArray(item.foodName) ? item.foodName :
                typeof item.foodName === 'string' ? item.foodName.split(',').map((s: string) => s.trim()) : [];

            return {
                date: item.startDate ? item.startDate.split(' ')[0] : null,
                startTime: item.startDate || null,
                endTime: item.endDate || null,
                foods: foods.map((name: string) => {
                    // Extract calorie info if present (e.g., "Mercimek Çorba (185 kcal)")
                    const calMatch = name.match(/\((\d+)\s*kcal\)/i);
                    return {
                        name: name.replace(/\(\d+\s*kcal\)/i, '').trim(),
                        calories: calMatch ? parseInt(calMatch[1]) : null,
                    };
                }),
            };
        }).filter((m: any) => m.date && m.foods.length > 0)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({ success: true, meals, count: meals.length });
    } catch (error: any) {
        console.error('Yemek fetch error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
