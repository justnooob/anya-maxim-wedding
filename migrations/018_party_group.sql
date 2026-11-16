-- Organizer-only planning. Guests do not disclose a gender or choose a party.
-- Past RSVP answers remain unchanged with a NULL group until an organizer assigns one.
ALTER TABLE rsvps ADD COLUMN party_group text;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_party_group_values
  CHECK (party_group IS NULL OR party_group IN ('bachelor','bachelorette'));
ALTER TABLE rsvps ADD CONSTRAINT rsvp_party_group_requires_interest
  CHECK (party_group IS NULL OR (attendance='yes' AND party_interest IS NOT DISTINCT FROM 'yes'));
