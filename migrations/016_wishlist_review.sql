-- Nullable state preserves legacy products and publication.
ALTER TABLE wishlist_items ADD COLUMN review_status text CHECK(review_status IS NULL OR review_status IN ('pending','approved','rejected'));
ALTER TABLE wishlist_items ADD COLUMN product_model text NOT NULL DEFAULT '' CHECK(char_length(product_model)<=240);
CREATE INDEX wishlist_review_batch_idx ON wishlist_items(review_status,seed_key) WHERE archived_at IS NULL;
