CREATE TABLE guest_sessions (
  id text PRIMARY KEY CHECK (id ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX guest_sessions_expiry_idx ON guest_sessions(expires_at);
CREATE TABLE rsvps (
  id uuid PRIMARY KEY,
  session_id text NOT NULL UNIQUE REFERENCES guest_sessions(id) ON DELETE CASCADE,
  guest_name text NOT NULL CHECK (char_length(guest_name) BETWEEN 1 AND 120),
  attendance text NOT NULL CHECK (attendance IN ('yes','no')),
  who text NOT NULL DEFAULT '' CHECK (char_length(who) <= 240),
  food text NOT NULL DEFAULT '' CHECK (char_length(food) <= 600),
  transfer text CHECK (transfer IN ('needed','self')),
  overnight text CHECK (overnight IN ('stay','leave')),
  dress_code boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((attendance='yes' AND transfer IS NOT NULL AND overnight IS NOT NULL AND dress_code)
    OR (attendance='no' AND transfer IS NULL AND overnight IS NULL AND NOT dress_code AND who='' AND food=''))
);
CREATE INDEX rsvps_attendance_created_idx ON rsvps(attendance,created_at,id);
CREATE INDEX rsvps_created_idx ON rsvps(created_at,id);
CREATE TABLE telegram_updates (
  id bigint PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE telegram_outbox (
  id uuid PRIMARY KEY,
  rsvp_id uuid REFERENCES rsvps(id) ON DELETE CASCADE,
  recipient text NOT NULL CHECK (recipient ~ '^[1-9][0-9]*$'),
  payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX telegram_outbox_ready_idx ON telegram_outbox(available_at,created_at);
CREATE TABLE delete_confirmations (
  token text PRIMARY KEY CHECK (token ~ '^[a-f0-9]{32}$'),
  rsvp_id uuid NOT NULL REFERENCES rsvps(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX delete_confirmations_expiry_idx ON delete_confirmations(expires_at);
CREATE TABLE rate_limits (
  key text NOT NULL,
  bucket bigint NOT NULL,
  count integer NOT NULL DEFAULT 1 CHECK (count > 0),
  PRIMARY KEY(key,bucket)
);
