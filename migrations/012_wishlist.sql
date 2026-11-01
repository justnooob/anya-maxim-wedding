-- Wishlist is independent of RSVP. No demo products or existing-data changes.
CREATE TABLE wishlist_categories (
 id text PRIMARY KEY, title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 60),
 sort_order integer NOT NULL DEFAULT 0
);
INSERT INTO wishlist_categories(id,title,sort_order) VALUES
 ('home','Для дома',0),('kitchen','Кухня',1),('tech','Техника',2),
 ('travel','Путешествия',3),('cozy','Для уюта',4),('other','Другое',5);
CREATE TABLE wishlist_settings (
 id integer PRIMARY KEY CHECK(id=1), show_reserver_names boolean NOT NULL DEFAULT false
);
INSERT INTO wishlist_settings(id) VALUES(1);
CREATE TABLE wishlist_sessions (
 id text PRIMARY KEY CHECK(id ~ '^[a-f0-9]{64}$'),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE INDEX wishlist_sessions_expiry_idx ON wishlist_sessions(expires_at);
CREATE TABLE wishlist_items (
 id uuid PRIMARY KEY, title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 140),
 comment text NOT NULL DEFAULT '' CHECK(char_length(comment)<=500),
 category text NOT NULL REFERENCES wishlist_categories(id),
 price integer CHECK(price BETWEEN 0 AND 100000000), currency text NOT NULL DEFAULT 'RUB' CHECK(currency='RUB'),
 image text NOT NULL DEFAULT '' CHECK(char_length(image)<=2048), priority boolean NOT NULL DEFAULT false,
 reservation_mode text NOT NULL DEFAULT 'single' CHECK(reservation_mode IN ('single','multiple')),
 sort_order integer NOT NULL DEFAULT 0, is_visible boolean NOT NULL DEFAULT true,
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), archived_at timestamptz,
 UNIQUE(id,reservation_mode)
);
CREATE INDEX wishlist_public_order_idx ON wishlist_items(priority DESC,sort_order,id) WHERE is_visible AND archived_at IS NULL;
CREATE TABLE wishlist_links (
 id uuid PRIMARY KEY, wishlist_item_id uuid NOT NULL REFERENCES wishlist_items(id) ON DELETE CASCADE,
 label text NOT NULL CHECK(char_length(btrim(label)) BETWEEN 1 AND 60),
 url text NOT NULL CHECK(char_length(url)<=2048 AND url ~ '^https?://'), sort_order integer NOT NULL DEFAULT 0
);
CREATE INDEX wishlist_links_item_idx ON wishlist_links(wishlist_item_id,sort_order);
CREATE TABLE wishlist_reservations (
 id uuid PRIMARY KEY, wishlist_item_id uuid NOT NULL,
 reservation_mode text NOT NULL CHECK(reservation_mode IN ('single','multiple')),
 reserver_name text NOT NULL CHECK(char_length(btrim(reserver_name)) BETWEEN 1 AND 80),
 anonymous_session_id text NOT NULL REFERENCES wishlist_sessions(id),
 status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled')),
 reserved_at timestamptz NOT NULL DEFAULT now(), cancelled_at timestamptz,
 cancelled_by text CHECK(cancelled_by IN ('guest','admin','archive')),
 FOREIGN KEY(wishlist_item_id,reservation_mode) REFERENCES wishlist_items(id,reservation_mode),
 CHECK((status='active' AND cancelled_at IS NULL AND cancelled_by IS NULL) OR (status='cancelled' AND cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL))
);
CREATE UNIQUE INDEX wishlist_single_active_unique ON wishlist_reservations(wishlist_item_id) WHERE status='active' AND reservation_mode='single';
CREATE UNIQUE INDEX wishlist_own_active_unique ON wishlist_reservations(wishlist_item_id,anonymous_session_id) WHERE status='active';
CREATE INDEX wishlist_reservations_owner_idx ON wishlist_reservations(anonymous_session_id) WHERE status='active';
CREATE INDEX wishlist_reservations_history_idx ON wishlist_reservations(wishlist_item_id,reserved_at);
