-- ============================================================
-- OEH Database Migrations
-- Run these in Supabase SQL Editor in order
-- ============================================================

-- 1. Add matching engine columns to loads table
ALTER TABLE loads
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','pending_match','filled','expired')),
  ADD COLUMN IF NOT EXISTS matched_escort_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS match_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS carrier_id UUID REFERENCES profiles(id);

-- 2. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(load_id, reviewer_id)
);

-- 3. Referral system
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referred_id UUID REFERENCES profiles(id),
  code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','converted','rewarded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ
);

-- 4. Add referral_code column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS loads_status_idx ON loads(status);
CREATE INDEX IF NOT EXISTS loads_carrier_id_idx ON loads(carrier_id);
CREATE INDEX IF NOT EXISTS loads_matched_escort_id_idx ON loads(matched_escort_id);
CREATE INDEX IF NOT EXISTS referrals_code_idx ON referrals(code);
CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON referrals(referrer_id);

-- 6. RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Reviews viewable by all" ON reviews FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Reviews insertable by auth" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- 7. RLS for referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Own referrals" ON referrals FOR ALL USING (auth.uid() = referrer_id);

-- 8. Function to update avg_rating on profiles after review insert
CREATE OR REPLACE FUNCTION update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    avg_rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_review_insert ON reviews;
CREATE TRIGGER after_review_insert
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_rating();

-- ============================================================
-- 9. Bids table (back-port from live schema)
-- The bids table was originally created via the Supabase Studio UI.
-- This block documents its shape so future rebuilds match production.
-- Safe to re-run: all statements are idempotent.
-- ============================================================
CREATE TABLE IF NOT EXISTS bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  load_id UUID NOT NULL REFERENCES loads(id) ON DELETE CASCADE,
  escort_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rate NUMERIC NOT NULL CHECK (rate > 0),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','rejected','withdrawn'))
);

CREATE INDEX IF NOT EXISTS bids_load_id_idx ON bids(load_id);
CREATE INDEX IF NOT EXISTS bids_escort_id_idx ON bids(escort_id);
CREATE INDEX IF NOT EXISTS bids_status_idx ON bids(status);

-- RLS template — review and apply manually in Supabase Studio if not already set:
-- ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY IF NOT EXISTS "Bids viewable by load owner or bidder"
--   ON bids FOR SELECT USING (
--     auth.uid() = escort_id
--     OR auth.uid() IN (SELECT carrier_id FROM loads WHERE loads.id = bids.load_id)
--   );
-- CREATE POLICY IF NOT EXISTS "Escorts insert own bids"
--   ON bids FOR INSERT WITH CHECK (auth.uid() = escort_id);
-- CREATE POLICY IF NOT EXISTS "Escorts update own bids"
--   ON bids FOR UPDATE USING (auth.uid() = escort_id);

