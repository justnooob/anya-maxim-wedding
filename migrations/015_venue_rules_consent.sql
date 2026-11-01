-- Additive only: historical RSVP are intentionally unknown, never backfilled.
ALTER TABLE rsvps ADD COLUMN venue_rules_accepted boolean;
ALTER TABLE rsvps ADD COLUMN venue_rules_accepted_at timestamptz;
ALTER TABLE rsvps ADD COLUMN venue_rules_version text;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_venue_consent_shape CHECK (
  (venue_rules_accepted IS NULL AND venue_rules_accepted_at IS NULL AND venue_rules_version IS NULL)
  OR (venue_rules_accepted IS FALSE AND venue_rules_accepted_at IS NULL AND venue_rules_version IS NULL)
  OR (venue_rules_accepted IS TRUE AND attendance='yes'
      AND venue_rules_accepted_at IS NOT NULL AND venue_rules_version IS NOT NULL
      AND char_length(btrim(venue_rules_version)) BETWEEN 1 AND 80)
);
