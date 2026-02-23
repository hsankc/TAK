-- Web Push API için Abonelik (Subscription) Tablosu
-- Kullanıcıların tarayıcı/cihaz bildirim izinlerini ve şifreleme anahtarlarını saklar.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Hızlı endpoint sorgusu için index
CREATE INDEX IF NOT EXISTS idx_push_endpoint ON push_subscriptions(endpoint);
