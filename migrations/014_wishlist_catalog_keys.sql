-- Additive editorial import provenance. Nullable for organizer-created gifts.
ALTER TABLE wishlist_items ADD COLUMN seed_key text;
CREATE UNIQUE INDEX wishlist_items_seed_key_unique ON wishlist_items(seed_key) WHERE seed_key IS NOT NULL;
INSERT INTO wishlist_categories(id,title,sort_order) VALUES ('certificates','Сертификаты',6) ON CONFLICT (id) DO NOTHING;
UPDATE wishlist_categories SET title='Для кухни' WHERE id='kitchen';
UPDATE wishlist_categories SET title='Для путешествий' WHERE id='travel';
