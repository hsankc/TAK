import { NextRequest, NextResponse } from 'next/server';
import { parsePDFSchedule } from '@/lib/pdf-parser-gemini';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const selectedClass = formData.get('class') as string | null;
    
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
    
    // Parse et (Gemini ile, sınıf filtresiyle)
    const classes = await parsePDFSchedule(buffer, selectedClass || undefined, apiKey);
    
    // Mevcut programı temizle
    const { error: deleteError } = await supabase
      .from('schedule')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
      console.warn('Delete error (might be empty table):', deleteError);
    }
    
    // Yeni dersleri ekle
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];
    
    const { data, error } = await supabase
      .from('schedule')
      .insert(classes.map(c => ({
        ...c,
        color: colors[Math.floor(Math.random() * colors.length)]
      })));
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      count: classes.length,
      message: `✅ ${classes.length} ders başarıyla eklendi!${selectedClass ? ` (${selectedClass})` : ''}`
    });
    
  } catch (error: any) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      { error: error.message || 'PDF işlenirken hata oluştu' },
      { status: 500 }
    );
  }
}
