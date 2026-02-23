import * as pdfParse from 'pdf-parse';
import Tesseract from 'tesseract.js';

// CommonJS module fix
const pdf = (pdfParse as any).default || pdfParse;

interface ParsedClass {
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  location?: string;
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF text extraction failed:', error);
    return '';
  }
}

async function extractTextWithOCR(buffer: Buffer): Promise<string> {
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'tur', {
      logger: (m) => console.log(m)
    });
    return text;
  } catch (error) {
    console.error('OCR failed:', error);
    return '';
  }
}

function parseScheduleText(text: string, classFilter?: string): ParsedClass[] {
  const classes: ParsedClass[] = [];
  
  const dayMap: Record<string, number> = {
    'pazar': 0, 'pazartesi': 1, 'salı': 2, 'sali': 2, 'çarşamba': 3, 'carsamba': 3,
    'perşembe': 4, 'persembe': 4, 'cuma': 5, 'cumartesi': 6
  };
  
  const lines = text.split('\n');
  let currentClass: string | null = null;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    // Sınıf başlığı algıla (örn: "1-A", "2/A", "3A", "1. Sınıf A", "BİLGİSAYAR 1-A")
    const classMatch = line.match(/(\d+)[.\-\/\s]*([A-Z]|Sınıf\s*[A-Z])/i);
    if (classMatch) {
      currentClass = classMatch[0].trim();
      continue;
    }
    
    // Eğer sınıf filtresi varsa ve şu anki sınıf eşleşmiyorsa, satırı atla
    if (classFilter && currentClass && !currentClass.includes(classFilter)) {
      continue;
    }
    
    // Gün algıla
    let dayOfWeek = -1;
    for (const [dayName, dayNum] of Object.entries(dayMap)) {
      if (lowerLine.includes(dayName)) {
        dayOfWeek = dayNum;
        break;
      }
    }
    
    if (dayOfWeek === -1) continue;
    
    // Saat aralığı algıla (09:00-11:00, 09.00-11.00, 09:00 - 11:00)
    const timeMatch = line.match(/(\d{2}[:\.]\d{2})\s*[-–]\s*(\d{2}[:\.]\d{2})/);
    if (!timeMatch) continue;
    
    const startTime = timeMatch[1].replace('.', ':');
    const endTime = timeMatch[2].replace('.', ':');
    
    // Ders adını al
    let subjectMatch = line.replace(timeMatch[0], '').trim();
    const parts = subjectMatch.split(/\s+/);
    
    // Gün ismini temizle
    const subject = parts.filter(p => !Object.keys(dayMap).includes(p.toLowerCase())).join(' ');
    
    // Lokasyon algıla (A101, B202, D-301 gibi)
    const locationMatch = subject.match(/[A-Z]-?\d{3,4}/);
    const location = locationMatch ? locationMatch[0] : undefined;
    const cleanSubject = location ? subject.replace(location, '').trim() : subject;
    
    if (cleanSubject) {
      classes.push({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        subject: cleanSubject,
        location
      });
    }
  }
  
  return classes;
}

// Sınıfları tespit et
function detectClasses(text: string): string[] {
  const classes = new Set<string>();
  const lines = text.split('\n');
  
  for (const line of lines) {
    // Sınıf başlığı algıla (örn: "1-A", "2/A", "3A", "BİLGİSAYAR 1-A")
    const classMatch = line.match(/(\d+)[.\-\/\s]*([A-Z])/i);
    if (classMatch) {
      classes.add(classMatch[0].trim());
    }
  }
  
  return Array.from(classes).sort();
}

export async function parsePDFSchedule(buffer: Buffer, classFilter?: string): Promise<ParsedClass[]> {
  // Önce normal text extraction dene
  let text = await extractTextFromPDF(buffer);
  
  console.log('Extracted text length:', text.length);
  console.log('First 500 chars:', text.substring(0, 500));
  
  // Text boşsa OCR kullan
  if (!text || text.length < 50) {
    console.log('Text extraction failed, trying OCR...');
    text = await extractTextWithOCR(buffer);
  }
  
  if (!text) {
    throw new Error('PDF parsing failed: No text found');
  }
  
  // Text'i parse et (sınıf filtresiyle)
  const classes = parseScheduleText(text, classFilter);
  
  if (classes.length === 0) {
    throw new Error('No classes found in PDF. Format might not be supported. Please try manual entry.');
  }
  
  return classes;
}

// Yeni fonksiyon: Sadece sınıfları tespit et
export async function detectClassesFromPDF(buffer: Buffer): Promise<string[]> {
  let text = await extractTextFromPDF(buffer);
  
  if (!text || text.length < 50) {
    text = await extractTextWithOCR(buffer);
  }
  
  if (!text) {
    return [];
  }
  
  return detectClasses(text);
}
