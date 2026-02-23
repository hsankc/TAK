# 🚀 Tak App (V1.0) - Kariyer & Fırsat Takip Üssü

Tak App, üniversite öğrencilerinin yaklaşan ders saatlerini, staj ilanlarını, hackathon süreçlerini ve hedeflerini **tek bir ekrandan, algoritmik bir süreç yönetimiyle** takip etmelerini sağlayan tam donanımlı bir organizasyon asistanıdır.

## ✨ Öne Çıkan Özellikler

*   **🏆 Algoritmik Süreç (Pipeline):** İstek listenize aldığınız bir staj ilanını sadece bir butonla "Başvurdum" olarak işaretleyebilir, ardından tek tuşla "Onaylandı" aşamasına taşıyıp en son olarak "Belgelerim" sekmesinde arşivleyebilirsiniz. Süreç tamamen mantıksal bir dizilimle (Pipeline) ilerler.
*   **📱 PWA - Progressive Web App:** Cihazınıza (iOS Safari veya Android Chrome üzerinden) yerel bir uygulama gibi indirebilirsiniz. Hızlı, hafif ve tamamen platform bağımsızdır.
*   **🔔 Arka Plan Push Bildirimleri:** Uygulama tamamen kapalı olsa bile:
    *   **Derslere Son 15 Dakika:** O an programınızda yaklaşan bir ders varsa ekranınıza telefon/masaüstü bildirimi düşer.
    *   **Fırsat Panik Uyarıları:** Başvurusunun bitmesine 3 günden az kalan etkinlikleriniz/stajlarınız varsa otomatik uyarılarak fırsatları kaçırmanızın önüne geçilir.
*   **🌐 Veri Kazıma & Otomasyon Ekosistemi:** `youthall`, `coderspace` ve `anbeankampus` web sitelerinden güncel ilanlar otomatik olarak toplanarak (Crawler/Scraper ile) "Tümü" ekranınıza yansıtılır.
*   **🍅 Pomodoro ve 📅 Takvim Modülleri:** Ders çalışma sürelerinizi efektif yönetebilir ve yaklaşan etkinliklerinizi takvim formatında inceleyebilirsiniz.

## 🛠 Kullanılan Teknolojiler

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **Şekillendirme ve Canlandırma:** Tailwind CSS, Framer Motion, Lucide Icons
*   **Backend & Veritabanı:** Supabase (PostgreSQL), Next.js API Routes (Serverless)
*   **Bildirim Mimari:** Web-Push kütüphanesi (VAPID Encryption)
*   **Sürekli Çalışma (Cron Tasks):** Vercel Cron

## 🚦 Nasıl Çalıştırılır? / Kurulum (Development)

Sistemi lokal bilgisayarınızda kurmak ve geliştirmek için aşağıdaki adımları izleyin:

### 1️⃣ Projeyi İndirin ve Bağımlılıkları Kurun
```bash
git clone https://github.com/KULLANICI_ADINIZ/tak-app.git
cd tak-app
npm install
```

### 2️⃣ Ortam Değişkenlerini (Environment Variables) Ayarlayın
Projenin kök dizinine bir `.env.local` adlı dosya açın ve içini şu şekilde doldurun:

```env
# Supabase Bağlantısı
NEXT_PUBLIC_SUPABASE_URL=https://<SUPABASE_URL_ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_API_KEY>

# Gemini & OpenAI Yapay Zeka Özellikleri (Pomodoro koçluğu vs. için)
GEMINI_API_KEY=<GEMINI_KEY>
OPENAI_API_KEY=<OPENAI_KEY>

# Push Notifications (Bildirim) Şifreleme Anahtarları
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<VAPID_PUBLIC>
VAPID_PRIVATE_KEY=<VAPID_PRIVATE>
```

### 3️⃣ Geliştirme (Development) Sunucusunu Başlatın
```bash
npm run dev
```
Uygulamanız [http://localhost:3000](http://localhost:3000) adresinde canlanacaktır.

---

> **Not:** Ürün Vercel'de barındırılacak şekilde ("Serverless" odaklı) optimize edilmiştir.
> **Not 2:** Geliştirmeyi kolaylaştırmak ve veritabanı kilitlerini (`check constraint`) yönetmek için `database_migration.sql` ve `setup_push_subscriptions.sql` dosyalarını inceleyebilirsiniz.
