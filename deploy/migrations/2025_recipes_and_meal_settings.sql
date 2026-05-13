-- ─────────────────────────────────────────────────────────────────────────────
-- PeakForm Bio — Meal Recommender migration
-- Run this in Supabase SQL editor (or psql) once.
-- Creates a shared recipe library and adds per-plan recommender settings.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Shared recipe library ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  meal_types    text[] NOT NULL DEFAULT '{}',          -- 'breakfast'|'lunch'|'dinner'|'snack'
  calories      numeric DEFAULT 0,
  protein       numeric DEFAULT 0,
  carbs         numeric DEFAULT 0,
  fat           numeric DEFAULT 0,
  prep_minutes  integer DEFAULT 0,
  dietary_tags  text[] NOT NULL DEFAULT '{}',          -- vegan, vegetarian, gluten-free, etc.
  photo_url     text DEFAULT '',                       -- data: URL or storage URL
  ingredients   jsonb NOT NULL DEFAULT '[]'::jsonb,    -- [{name, qty, unit}, ...]
  instructions  text DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recipes_meal_types_idx   ON recipes USING gin (meal_types);
CREATE INDEX IF NOT EXISTS recipes_dietary_tags_idx ON recipes USING gin (dietary_tags);

CREATE OR REPLACE FUNCTION recipes_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recipes_touch ON recipes;
CREATE TRIGGER trg_recipes_touch
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION recipes_touch_updated_at();

-- RLS: any authenticated user can read; only the admin email can write.
-- Edit the email below to match ADMIN_EMAIL in Admin.html (currently bryanplett@gmail.com).
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipes read" ON recipes;
CREATE POLICY "recipes read" ON recipes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "recipes admin write" ON recipes;
CREATE POLICY "recipes admin write" ON recipes
  FOR ALL TO authenticated
  USING (auth.email() = 'bryanplett@gmail.com')
  WITH CHECK (auth.email() = 'bryanplett@gmail.com');


-- 2. Per-plan meal-recommender settings ───────────────────────────────────────
-- Stores macro split %, fit tolerance, and the client-can-choose-alternatives
-- flag directly on the nutrition plan so it travels with the rest of the plan.
--
-- Shape: { splits: [30,30,10,30], tolerance: {protein:10,carbs:15,fat:5}, clientCanChoose: false }
ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS meal_settings jsonb NOT NULL DEFAULT '{}'::jsonb;


-- 3. (Optional) Client meal picks ─────────────────────────────────────────────
-- If you want client meal picks to sync across devices, uncomment this table.
-- Otherwise picks are stored client-side in localStorage which works fine on
-- a single device.
--
-- CREATE TABLE IF NOT EXISTS client_meal_picks (
--   id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
--   client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
--   plan_id         uuid NOT NULL REFERENCES nutrition_plans(id) ON DELETE CASCADE,
--   day_index       int NOT NULL,
--   meal_index      int NOT NULL,
--   pick_recipe_id  uuid REFERENCES recipes(id) ON DELETE SET NULL,
--   pick_date       date NOT NULL DEFAULT CURRENT_DATE,
--   created_at      timestamptz NOT NULL DEFAULT now(),
--   UNIQUE (client_id, plan_id, day_index, meal_index, pick_date)
-- );

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE. Verify with:
--   SELECT count(*) FROM recipes;
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name='nutrition_plans' AND column_name='meal_settings';
-- ─────────────────────────────────────────────────────────────────────────────
