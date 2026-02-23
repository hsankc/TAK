-- 1. Önce eski kısıtlamaları (constraint) kaldıralım ki verileri güncelleyebilelim
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_category_check;
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_source_check;

-- 2. Eski kategorileri yeni 4'lü sisteme eşitleyelim
UPDATE opportunities SET category = 'hackathon' WHERE category IN ('competition', 'yarışma');
UPDATE opportunities SET category = 'bootcamp' WHERE category IN ('education', 'scholarship', 'kamp', 'eğitim');
UPDATE opportunities SET category = 'is_staj' WHERE category IN ('staj', 'is_ilani', 'iş_ilani');
UPDATE opportunities SET category = 'etkinlik' WHERE category IS NULL OR category NOT IN ('hackathon', 'bootcamp', 'is_staj');

-- 3. Yeni kısıtlamaları (constraint) ekleyelim
ALTER TABLE opportunities ADD CONSTRAINT opportunities_category_check 
  CHECK (category IN ('hackathon', 'bootcamp', 'is_staj', 'etkinlik'));

-- 4. Source kısıtlamasını artık esnek bırakıyoruz (25+ site geleceği için)
-- Eğer varsa source check'ini de yukarıda sildik.
