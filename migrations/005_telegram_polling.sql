CREATE TABLE telegram_polling_state (
 bot_id bigint PRIMARY KEY,
 next_offset bigint NOT NULL DEFAULT 0 CONSTRAINT telegram_polling_offset_nonnegative CHECK (next_offset >= 0),
 updated_at timestamptz NOT NULL DEFAULT now()
);
