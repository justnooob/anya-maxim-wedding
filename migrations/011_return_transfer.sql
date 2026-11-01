-- Historical answers keep NULL. Only new GOING submissions require a choice.
ALTER TABLE rsvps ADD COLUMN return_transfer text;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_return_transfer_values CHECK (return_transfer IS NULL OR return_transfer IN ('needed','not_needed'));
ALTER TABLE rsvps ADD CONSTRAINT rsvp_no_return_transfer CHECK (attendance='yes' OR return_transfer IS NULL);
