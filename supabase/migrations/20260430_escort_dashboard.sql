-- Task 3: Escort dashboard — expenses + breakdown protocol
CREATE TABLE IF NOT EXISTS escort_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escort_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  load_id UUID REFERENCES loads(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('mileage','fuel','lodging','meal','toll','other')),
  miles NUMERIC,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  note TEXT,
  incurred_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS escort_expenses_escort_id_idx ON escort_expenses(escort_id);
CREATE INDEX IF NOT EXISTS escort_expenses_incurred_on_idx ON escort_expenses(incurred_on);
ALTER TABLE escort_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Own expenses select" ON escort_expenses;
CREATE POLICY "Own expenses select" ON escort_expenses FOR SELECT USING (auth.uid() = escort_id);
DROP POLICY IF EXISTS "Own expenses insert" ON escort_expenses;
CREATE POLICY "Own expenses insert" ON escort_expenses FOR INSERT WITH CHECK (auth.uid() = escort_id);
DROP POLICY IF EXISTS "Own expenses update" ON escort_expenses;
CREATE POLICY "Own expenses update" ON escort_expenses FOR UPDATE USING (auth.uid() = escort_id);
DROP POLICY IF EXISTS "Own expenses delete" ON escort_expenses;
CREATE POLICY "Own expenses delete" ON escort_expenses FOR DELETE USING (auth.uid() = escort_id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS breakdown_protocol_enabled BOOLEAN NOT NULL DEFAULT false;
