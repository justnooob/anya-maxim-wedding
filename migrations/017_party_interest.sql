-- Non-destructive nullable field: past guest responses retain NULL, not an invented answer.
ALTER TABLE rsvps ADD COLUMN party_interest text;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_party_interest_values CHECK (party_interest IS NULL OR party_interest IN ('yes','no'));
ALTER TABLE rsvps ADD CONSTRAINT rsvp_no_party_interest_when_declined CHECK (attendance='yes' OR party_interest IS NULL);
