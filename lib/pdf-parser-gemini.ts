import { GoogleGenerativeAI } from '@google/generative-ai';

interface ParsedClass {
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: string;
  location?: string;
}

interface ClassSchedule {
  className: string;
  courses: ParsedClass[];
}

// Gemini'ye PDF'i doğrudan gönder (Vision modeli)
async function parseWithGeminiVision(pdfBuffer: Buffer, apiKey: string, classFilter?: string): Promise<ClassSchedule[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const pdfBase64 = pdfBuffer.toString('base64');

  const filterInstruction = classFilter
    ? `\nSADECE "${classFilter}" sınıfının programını çıkar.`
    : '';

  const prompt = `Bu bir üniversite/lise ders programı PDF'i. İçindeki ders programını analiz et ve her sınıf için JSON formatında çıktı ver.${filterInstruction}

ÇIKTI FORMATI (sadece JSON Array, başka bir şey yazma):
[
  {
    "className": "1. SINIF",
    "courses": [
      {
        "day_of_week": 1,
        "start_time": "09:00",
        "end_time": "09:45",
        "subject": "Matematik II",
        "location": "A305"
      }
    ]
  }
]

KURALLAR:
- day_of_week: 0=Pazar, 1=Pazartesi, 2=Salı, 3=Çarşamba, 4=Perşembe, 5=Cuma, 6=Cumartesi
- start_time ve end_time: HH:MM formatında (örn: "09:00")
- subject: Ders adı (kodu dahil, parantez içindeki gereksiz numaraları çıkar)
- location: Sınıf/yer bilgisi varsa ekle (A305, Lab1, Online, vb.)
- Boş saatleri ATLAMA
- Sadece JSON döndür, başka açıklama YAZMA`;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64,
      },
    },
    { text: prompt },
  ]);

  const response = result.response.text();
  console.log('Gemini response:', response.substring(0, 500));

  // JSON'u parse et (```json ... ``` wrapper'ı temizle)
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Gemini geçerli JSON döndüremedi');
  }

  return JSON.parse(jsonMatch[0]);
}

// Sınıfları tespit et
export async function detectClassesFromPDF(buffer: Buffer, apiKey?: string): Promise<string[]> {
  if (!apiKey) return [];

  try {
    const schedules = await parseWithGeminiVision(buffer, apiKey);
    return schedules.map(s => s.className);
  } catch (error) {
    console.error('Gemini class detection failed:', error);
    return [];
  }
}

// Ana parsing fonksiyonu
export async function parsePDFSchedule(
  buffer: Buffer,
  classFilter?: string,
  apiKey?: string
): Promise<ParsedClass[]> {
  if (!apiKey) {
    throw new Error('Gemini API key gerekli. .env.local dosyasına GEMINI_API_KEY ekleyin.');
  }

  try {
    const schedules = await parseWithGeminiVision(buffer, apiKey, classFilter);

    if (classFilter) {
      const filtered = schedules.find(s => s.className.includes(classFilter));
      if (filtered) return filtered.courses;
    }

    const allCourses = schedules.flatMap(s => s.courses);
    if (allCourses.length === 0) {
      throw new Error('PDF\'te ders bulunamadı. Lütfen manuel ekleyin.');
    }
    return allCourses;
  } catch (error) {
    console.error('Gemini parsing failed:', error);
    throw new Error('PDF analizi başarısız: ' + (error as Error).message);
  }
}
