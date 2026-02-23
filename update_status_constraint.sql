-- Fırsatlar V3.1 Status Güncellemesi
-- Bu betik, opportunities tablosundaki 'status' kısıtlamasını (constraint)
-- yeni eklenen 'certificate' ve güncellenen 'accepted' vb durumları kapsayacak şekilde günceller.

-- 1. Eski kısıtlamayı kaldırıyoruz
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_status_check;

-- 2. Eğer tabloda yanlış isimle kalmış durumlar varsa onları temizleyelim (Opsiyonel)
-- Örneğin eskiden 'archived' olarak tutulan varsa onları 'accepted' yapalım ki sekmede görünsün.
UPDATE opportunities SET status = 'accepted' WHERE status = 'archived';

-- 3. Yeni kısıtlamayı (constraint) tüm ihtimalleri kapsayacak şekilde ekliyoruz
ALTER TABLE opportunities ADD CONSTRAINT opportunities_status_check 
  CHECK (status IN ('new', 'pending', 'wishlist', 'applied', 'waiting', 'rejected', 'accepted', 'certificate'));
