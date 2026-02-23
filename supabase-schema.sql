-- Supabase SQL Editor'de çalıştırılacak şema

-- İLANLAR TABLOSU
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  description TEXT,
  deadline TIMESTAMP,
  category TEXT CHECK (category IN ('hackathon', 'bootcamp', 'is_staj', 'etkinlik')),
  source TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'wishlist', 'applied', 'waiting', 'rejected', 'accepted')),
  location_type TEXT DEFAULT 'TR' CHECK (location_type IN ('TR', 'Global')),
  tags TEXT[] DEFAULT '{}',
  relevance_score INTEGER DEFAULT 0,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- DERS PROGRAMI
CREATE TABLE schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject TEXT NOT NULL,
  location TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT NOW()
);

-- GÜNLÜK HEDEFLER / TO-DO
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_date DATE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AKADEMİK TAKİP SİSTEMİ
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  absence_limit INTEGER DEFAULT 4,
  total_weeks INTEGER DEFAULT 16,
  color TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  week_number INTEGER CHECK (week_number BETWEEN 1 AND 16),
  status TEXT CHECK (status IN ('attended', 'skipped')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(course_id, week_number)
);

CREATE TABLE course_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PERFORMANS İNDEKSLERİ
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);
CREATE INDEX idx_opportunities_category ON opportunities(category);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_schedule_day ON schedule(day_of_week);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_attendance_course ON attendance(course_id);
CREATE INDEX idx_notes_course ON course_notes(course_id);
