import { NextResponse } from 'next/server';

const GOOGLE_CALENDAR_ICS = 'https://calendar.google.com/calendar/ical/hasankasikci80%40gmail.com/private-d0d4d42eb64bbfc75cda7eccfc53d254/basic.ics';

function parseICS(icsText: string) {
    const events: any[] = [];
    const blocks = icsText.split('BEGIN:VEVENT');

    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i].split('END:VEVENT')[0];
        const event: any = {};

        // Parse each line
        const lines = block.split('\n');
        let currentKey = '';
        let currentValue = '';

        for (const rawLine of lines) {
            const line = rawLine.replace(/\r/g, '');

            // Continuation line (starts with space or tab)
            if (line.startsWith(' ') || line.startsWith('\t')) {
                currentValue += line.substring(1);
                continue;
            }

            // Save previous key-value
            if (currentKey) {
                event[currentKey] = currentValue;
            }

            // Parse new key-value
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                let key = line.substring(0, colonIdx);
                // Handle keys with params like DTSTART;VALUE=DATE:20260301
                const semiIdx = key.indexOf(';');
                if (semiIdx > 0) {
                    const params = key.substring(semiIdx + 1);
                    key = key.substring(0, semiIdx);
                    event[key + '_PARAMS'] = params;
                }
                currentKey = key;
                currentValue = line.substring(colonIdx + 1);
            }
        }
        // Save last key-value
        if (currentKey) {
            event[currentKey] = currentValue;
        }

        // Parse dates
        let start: Date | null = null;
        let end: Date | null = null;

        if (event.DTSTART) {
            start = parseICSDate(event.DTSTART);
        }
        if (event.DTEND) {
            end = parseICSDate(event.DTEND);
        }

        if (start) {
            // Unescape ICS text
            const title = (event.SUMMARY || 'Etkinlik')
                .replace(/\\n/g, ' ')
                .replace(/\\,/g, ',')
                .replace(/\\\\/g, '\\');

            const location = (event.LOCATION || '')
                .replace(/\\n/g, ' ')
                .replace(/\\,/g, ',')
                .replace(/\\\\/g, '\\');

            const description = (event.DESCRIPTION || '')
                .replace(/\\n/g, '\n')
                .replace(/\\,/g, ',')
                .replace(/\\\\/g, '\\');

            events.push({
                id: event.UID || `gcal-${i}`,
                title,
                description,
                location,
                start: start.toISOString(),
                end: end ? end.toISOString() : null,
                type: 'google',
            });
        }
    }

    return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function parseICSDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Format: 20260301 (all-day) or 20260301T100000 or 20260301T100000Z
    const clean = dateStr.trim();

    if (clean.length === 8) {
        // All-day: YYYYMMDD
        const y = parseInt(clean.substring(0, 4));
        const m = parseInt(clean.substring(4, 6)) - 1;
        const d = parseInt(clean.substring(6, 8));
        return new Date(y, m, d);
    }

    if (clean.length >= 15) {
        // DateTime: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
        const y = parseInt(clean.substring(0, 4));
        const m = parseInt(clean.substring(4, 6)) - 1;
        const d = parseInt(clean.substring(6, 8));
        const h = parseInt(clean.substring(9, 11));
        const min = parseInt(clean.substring(11, 13));
        const s = parseInt(clean.substring(13, 15));

        if (clean.endsWith('Z')) {
            return new Date(Date.UTC(y, m, d, h, min, s));
        }
        return new Date(y, m, d, h, min, s);
    }

    return null;
}

export async function GET() {
    try {
        const response = await fetch(GOOGLE_CALENDAR_ICS, {
            next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
            throw new Error(`ICS fetch failed: ${response.status}`);
        }

        const icsText = await response.text();
        const events = parseICS(icsText);

        return NextResponse.json({ success: true, events, count: events.length });
    } catch (error: any) {
        console.error('Google Calendar fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
