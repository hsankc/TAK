export type Category = 'hackathon' | 'bootcamp' | 'is_staj' | 'etkinlik';

export function detectCategory(text: string): Category {
  const lower = text.toLowerCase();
  if (/hackathon|datathon|ideathon|yarışma|competition|challenge/.test(lower)) return 'hackathon';
  if (/eğitim|bootcamp|workshop|akademi|kurs|okul|school|academy|sertifika|training/.test(lower)) return 'bootcamp';
  if (/staj|intern|career|kariyer|graduate|iş|job|recruit|hiring/.test(lower)) return 'is_staj';
  return 'etkinlik';
}

export function detectTags(text: string): string[] {
  const tags: string[] = [];
  const lower = text.toLowerCase();
  if (/yazılım|software|kodlama|coding|programlama|developer|frontend|backend|fullstack/.test(lower)) tags.push('Yazılım');
  if (/yapay zeka|ai|machine learning|ml|deep learning/.test(lower)) tags.push('Yapay Zeka');
  if (/veri|data|big data|analytics/.test(lower)) tags.push('Veri');
  if (/tasarım|design|ux|ui/.test(lower)) tags.push('Tasarım');
  return tags;
}

export function calculateRelevance(title: string, description: string = ''): number {
  let score = 0;
  const content = (title + ' ' + description).toLowerCase();
  if (/yazılım|kodlama|bilgisayar|computer|software|coding|frontend|backend|fullstack|develop/.test(content)) score += 50;
  if (/yapay zeka|ai|machine learning/.test(content)) score += 30;
  if (/hackathon|yarışma|competition/.test(content)) score += 20;
  return Math.min(score, 100);
}

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

  let cleaned = dateStr
    .replace(/son\s+başvuru\s*tarihi?:?/gi, '')
    .replace(/son\s+başvuru:?/gi, '')
    .replace(/deadline:?/gi, '')
    .replace(/apply\s+by:?/gi, '')
    .replace(/(\d+)(st|nd|rd|th)\b/gi, '$1')
    .replace(/[,]/g, ' ')
    .trim()
    .toLowerCase();

  if (!cleaned) return null;

  // Try ISO format first
  const isoDate = new Date(cleaned);
  if (!isNaN(isoDate.getTime()) && cleaned.includes('-') && cleaned.length >= 10) return isoDate;

  // Numeric: DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const numericFull = cleaned.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/);
  if (numericFull) return new Date(parseInt(numericFull[3]), parseInt(numericFull[2]) - 1, parseInt(numericFull[1]));

  // "16 May 2025" or "May 16 2025"
  const withYearMatch = cleaned.match(/(?:(\d{1,2})\s+([a-züşığçö]+)\s+(\d{4}))|(?:([a-züşığçö]+)\s+(\d{1,2})\s+(\d{4}))/i);
  if (withYearMatch) {
    const day = parseInt(withYearMatch[1] || withYearMatch[5]);
    const monthStr = (withYearMatch[2] || withYearMatch[4]).toLowerCase();
    const year = parseInt(withYearMatch[3] || withYearMatch[6]);
    const month = ALL_MONTHS[monthStr];
    if (month !== undefined) return new Date(year, month, day);
  }

  // "16 May" or "May 16" (no year — guess it)
  const withoutYearMatch = cleaned.match(/(?:(\d{1,2})\s+([a-züşığçö]+))|(?:([a-züşığçö]+)\s+(\d{1,2}))/i);
  if (withoutYearMatch) {
    const day = parseInt(withoutYearMatch[1] || withoutYearMatch[4]);
    const monthStr = (withoutYearMatch[2] || withoutYearMatch[3]).toLowerCase();
    const month = ALL_MONTHS[monthStr];
    if (month !== undefined) return new Date(guessYear(month, day), month, day);
  }

  return null;
}
