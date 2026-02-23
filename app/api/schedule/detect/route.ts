import { NextRequest, NextResponse } from 'next/server';
import { detectClassesFromPDF } from '@/lib/pdf-parser-gemini';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Geçersiz dosya. Lütfen PDF yükleyin.' },
        { status: 400 }
      );
    }
    
    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Dosya çok büyük. Maksimum 5MB.' },
        { status: 400 }
      );
    }
    
    // PDF'i buffer'a çevir
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Sınıfları tespit et
    const classes = await detectClassesFromPDF(buffer, apiKey);
    
    return NextResponse.json({
      success: true,
      classes
    });
    
  } catch (error: any) {
    console.error('PDF class detection error:', error);
    return NextResponse.json(
      { error: error.message || 'PDF işlenirken hata oluştu' },
      { status: 500 }
    );
  }
}
