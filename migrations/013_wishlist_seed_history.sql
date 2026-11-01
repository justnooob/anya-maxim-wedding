-- Additive only. Gift records are imported by the explicit versioned seed.
CREATE TABLE app_seed_history (
 key text PRIMARY KEY,
 version integer NOT NULL CHECK (version > 0),
 applied_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO wishlist_categories(id,title,sort_order)
VALUES ('experiences','Впечатления',5) ON CONFLICT (id) DO NOTHING;
