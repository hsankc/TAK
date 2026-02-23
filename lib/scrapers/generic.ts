import axios from 'axios';
import * as cheerio from 'cheerio';

const TR_MONTHS: Record<string, number> = {
    ocak: 0, şubat: 1, mart: 2, nisan: 3, mayıs: 4, haziran: 5,
    temmuz: 6, ağustos: 7, eylül: 8, ekim: 9, kasım: 10, aralık: 11,
};

const EN_MONTHS: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
    jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const ALL_MONTHS: Record<string, number> = { ...TR_MONTHS, ...EN_MONTHS };

function guessYear(month: number, day: number): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const candidate = new Date(currentYear, month, day);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (candidate < sevenDaysAgo) return currentYear + 1;
    return currentYear;
}

export function parseDate(dateStr: string): Date | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    let cleaned = dateStr.replace(/son\s+başvuru\s*tarihi?:?/gi, '').replace(/son\s+başvuru:?/gi, '').replace(/deadline:?/gi, '').replace(/apply\s+by:?/gi, '').replace(/(\d+)(st|nd|rd|th)\b/gi, '$1').replace(/[,]/g, ' ').trim().toLowerCase();
    if (!cleaned) return null;
    const numericFull = cleaned.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/);
    if (numericFull) return new Date(parseInt(numericFull[3]), parseInt(numericFull[2]) - 1, parseInt(numericFull[1]));
    const withYearMatch = cleaned.match(/(?:(\d{1,2})\s+([a-züşığçö]+)\s+(\d{4}))|(?:([a-züşığçö]+)\s+(\d{1,2})\s+(\d{4}))/i);
    if (withYearMatch) {
        let day = parseInt(withYearMatch[1] || withYearMatch[5]);
        let monthStr = (withYearMatch[2] || withYearMatch[4]).toLowerCase();
        let year = parseInt(withYearMatch[3] || withYearMatch[6]);
        const month = ALL_MONTHS[monthStr];
        if (month !== undefined) return new Date(year, month, day);
    }
    const withoutYearMatch = cleaned.match(/(?:(\d{1,2})\s+([a-züşığçö]+))|(?:([a-züşığçö]+)\s+(\d{1,2}))/i);
    if (withoutYearMatch) {
        let day = parseInt(withoutYearMatch[1] || withoutYearMatch[4]);
        let monthStr = (withoutYearMatch[2] || withoutYearMatch[3]).toLowerCase();
        const month = ALL_MONTHS[monthStr];
        if (month !== undefined) return new Date(guessYear(month, day), month, day);
    }
    return null;
}

const DATE_PATTERNS = [
    /(deadline|son\s+başvuru\s*tarihi?|apply\s+by)\s*:?\s*([^\n<]{3,40})/gi,
    /\b(\d{1,2}[\s.\/\-](?:[a-züşığçö]+|\d{1,2})[\s.\/\-]\d{2,4})\b/gi,
    /\b((?:january|february|march|april|may|june|july|august|september|october|november|december|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)?\s+(?:january|february|march|april|may|june|july|august|september|october|november|december|ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık))\b/gi,
];

export function extractDateFromText(text: string): Date | null {
    for (const pattern of DATE_PATTERNS) {
        pattern.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
            const candidate = match[2] ?? match[1] ?? match[0];
            if (!candidate) continue;
            const parsed = parseDate(candidate.trim());
            if (parsed) return parsed;
        }
    }
    return null;
}

export async function scrapeUrl(url: string) {
    try {
        const { data } = await axios.get(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Tak-App/1.0)' },
        });
        const $ = cheerio.load(data);

        // Get Title
        const title = $('title').text().replace(/ - Patika\.dev| - Youthall| - MLH| Event| Bootcamp/gi, '').trim() ||
            $('h1').first().text().trim() ||
            'Yeni İlan';

        // Strateji 1: JSON-LD
        let deadline: Date | null = null;
        const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
        for (const script of jsonLdScripts) {
            try {
                const json = JSON.parse($(script).html() ?? '{}');
                const dateStr = json.applicationDeadline || json.endDate || json.validThrough;
                if (dateStr) {
                    deadline = parseDate(dateStr);
                    if (deadline) break;
                }
            } catch { }
        }

        // Strateji 2: Body Text Regex
        if (!deadline) {
            deadline = extractDateFromText($('body').text());
        }

        return {
            title,
            url,
            deadline,
            description: $('meta[name="description"]').attr('content') || title
        };
    } catch (error) {
        console.error(`Scrape URL error: ${url}`, error);
        return null;
    }
}
