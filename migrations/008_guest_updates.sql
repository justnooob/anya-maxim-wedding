-- Additive rollout: preserve legacy answers, session FK and idempotency unique index.
DROP TRIGGER IF EXISTS rsvp_session_capacity ON rsvps;
DROP FUNCTION IF EXISTS enforce_rsvp_session_capacity();
ALTER TABLE rsvps DROP CONSTRAINT rsvps_transfer_check;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_transfer_values CHECK (transfer IN ('needed','self','kupchino','pavlovsk'));
ALTER TABLE rsvps DROP CONSTRAINT rsvps_check;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_attendance_details CHECK (
 (attendance='yes' AND transfer IS NOT NULL AND dress_code)
 OR (attendance='no' AND transfer IS NULL AND overnight IS NULL AND NOT dress_code AND who='' AND food='')
);
-- overnight remains nullable; historical values are not rewritten.
