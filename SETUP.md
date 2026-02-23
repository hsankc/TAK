# 📋 TAK - Kurulum Talimatları

## ✅ Adım Adım Setup

### 1️⃣ Supabase Veritabanı Kurulumu

#### a) Hesap Oluşturma
1. [supabase.com](https://supabase.com) adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın (veya email ile kayıt olun)

#### b) Proje Oluşturma
1. Dashboard'da "New Project" butonuna tıklayın
2. Organization seçin (yoksa oluşturun)
3. Proje bilgilerini doldurun:
   - **Name**: `tak-app` (veya dilediğiniz isim)
   - **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
   - **Region**: En yakın bölge (örn: Frankfurt)
4. "Create new project" butonuna tıklayın
5. 2-3 dakika bekleyin (veritabanı oluşturuluyor)

#### c) Veritabanı Şemasını Oluşturma
1. Sol menüden **"SQL Editor"** seçin
2. "New query" butonuna tıklayın
3. `supabase-schema.sql` dosyasını açın ve tüm içeriği kopyalayın
4. SQL Editor'e yapıştırın
5. Sağ üstteki **"Run"** butonuna (▶️) tıklayın
6. Başarılı mesajı görmelisiniz: "Success. No rows returned"

#### d) API Keys'i Kopyalama
1. Sol menüden **"Settings"** → **"API"** seçin
2. Şu bilgileri kopyalayın:
   - **Project URL** (örn: `https://abcdefgh.supabase.co`)
   - **anon public** key (uzun bir string)

---

### 2️⃣ Environment Variables Ayarlama

#### Windows:
1. `tak-app` klasörüne gidin
2. `.env.local` dosyasını text editor ile açın
3. Aşağıdaki değerleri Supabase'den kopyaladığınız bilgilerle değiştirin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. Dosyayı kaydedin (Ctrl+S)

---

### 3️⃣ Projeyi Çalıştırma

#### Terminal/PowerShell'de:

```powershell
# 1. Klasöre gidin
cd "C:\Verdent Project\Tak\tak-app"

# 2. Bağımlılıkları yükleyin (ilk defa çalıştırıyorsanız)
npm install

# 3. Development server'ı başlatın
npm run dev
```

#### Beklenen Çıktı:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.3s
```

#### Tarayıcıda Test:
1. Tarayıcınızı açın
2. `http://localhost:3000` adresine gidin
3. **Dashboard** sayfasını görmelisiniz

---

### 4️⃣ İlk Testi Yapma

#### a) Ders Programı Testi (Manuel)
1. Sol menüden **"Ders Programı"** seçin
2. Sağ üstteki **"Manuel Ekle"** butonuna tıklayın
3. Form'u doldurun:
   - Gün: Pazartesi
   - Başlangıç: 09:00
   - Bitiş: 11:00
   - Ders Adı: Test Dersi
4. **"Ekle"** butonuna tıklayın
5. Grid'de dersinizi görmelisiniz ✅

#### b) To-Do Testi
1. Sol menüden **"Günlük Hedefler"** seçin
2. "Yeni hedef ekle..." inputuna bir şeyler yazın
3. **"Ekle"** butonuna tıklayın
4. Listte görevinizi görmelisiniz ✅

#### c) İlan Toplama Testi (Web Scraping)
1. Sol menüden **"Fırsatlar"** seçin
2. **"İlanları Çek"** butonuna tıklayın
3. 5-10 saniye bekleyin
4. Alert mesajı: "X yeni ilan eklendi!"

⚠️ **Not**: Web scraping çalışmazsa (0 ilan):
- `lib/scrapers/*.ts` dosyalarındaki HTML selector'ları güncelleyin
- Sitelerin HTML yapısı değişmiş olabilir
- Chrome DevTools ile gerçek class/id'leri bulun

---

## 🔧 Sorun Giderme

### Sorun: "Module not found" hatası
**Çözüm:**
```bash
npm install
```

### Sorun: Supabase bağlantı hatası
**Çözüm:**
1. `.env.local` dosyasındaki URL ve Key'leri kontrol edin
2. Supabase project'in aktif olduğundan emin olun
3. SQL şemasının başarıyla çalıştığını doğrulayın

### Sorun: PDF upload çalışmıyor
**Çözüm:**
1. PDF dosyası 5MB'dan küçük olmalı
2. `lib/pdf-parser.ts` dosyasındaki parser'ı kendi PDF formatınıza göre özelleştirin
3. Console'da (F12) hata mesajlarını kontrol edin

### Sorun: Scraping 0 ilan buluyor
**Çözüm:**
1. Hedef sitelerin HTML yapısı değişmiş olabilir
2. `lib/scrapers/youthall.ts` gibi dosyaları açın
3. Siteleri Chrome'da inspect edin (F12 → Elements)
4. Gerçek class/id isimlerini bulup güncelleyin

---

## 📱 PDF Upload Kullanım İpuçları

### Desteklenen Format Örnekleri:

**Format 1 (Basit):**
```
Pazartesi 09:00-11:00 Matematik A101
Salı 13:00-15:00 Fizik B202
```

**Format 2 (Detaylı):**
```
Pazartesi
  09:00 - 11:00 | Matematik | A101
  13:00 - 15:00 | Algoritma | C103
```

### Eğer PDF Parsing Çalışmazsa:
1. `lib/pdf-parser.ts` dosyasını açın
2. `parseScheduleText` fonksiyonunu inceleyin
3. PDF'inizin formatına göre regex'leri düzeltin
4. Test için console.log ekleyin:
```typescript
console.log('Extracted text:', text);
console.log('Parsed classes:', classes);
```

---

## 🌐 Production'a Deployment

### Vercel ile Deploy (Önerilen):

```bash
# 1. Git repository oluştur
git init
git add .
git commit -m "Initial commit: Tak app"

# 2. GitHub'a push et (önce GitHub'da repo oluşturun)
git remote add origin https://github.com/your-username/tak-app.git
git push -u origin main

# 3. Vercel'e deploy et
```

1. [vercel.com](https://vercel.com) adresine gidin
2. "Import Project" → GitHub repository'nizi seçin
3. **Environment Variables** bölümünde ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. "Deploy" butonuna tıklayın
5. 2-3 dakika sonra canlı URL: `https://tak-app.vercel.app`

---

## ✅ Başarı Kontrol Listesi

- [ ] Supabase projesi oluşturuldu
- [ ] SQL şeması çalıştırıldı
- [ ] `.env.local` dosyası düzenlendi
- [ ] `npm install` tamamlandı
- [ ] `npm run dev` başarılı
- [ ] Dashboard açıldı
- [ ] Manuel ders ekleme çalıştı
- [ ] To-do ekleme çalıştı
- [ ] İlan scraping test edildi (opsiyonel)

Tüm adımlar tamamsa **projeniz hazır!** 🎉

---

## 📚 Ek Kaynaklar

- [Next.js Dokümantasyonu](https://nextjs.org/docs)
- [Supabase Dokümantasyonu](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Cheerio (Web Scraping)](https://cheerio.js.org/)

---

**İyi çalışmalar! 🚀**
