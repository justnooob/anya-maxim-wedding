-- Preserve historical RSVP: new columns are nullable. New GOING requirements
-- are enforced by server validation; no old answer is invented or deleted.
ALTER TABLE rsvps ADD COLUMN congratulation_choice text;
ALTER TABLE rsvps ADD COLUMN congratulation_companion text;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_congratulation_values CHECK (congratulation_choice IS NULL OR congratulation_choice IN ('public','private','public_with_someone'));
ALTER TABLE rsvps ADD CONSTRAINT rsvp_congratulation_companion CHECK (
 (congratulation_choice IS NOT DISTINCT FROM 'public_with_someone' AND congratulation_companion IS NOT NULL AND char_length(btrim(congratulation_companion)) BETWEEN 1 AND 120)
 OR (congratulation_choice IS DISTINCT FROM 'public_with_someone' AND congratulation_companion IS NULL)
);
ALTER TABLE rsvps ADD CONSTRAINT rsvp_no_congratulation CHECK (attendance='yes' OR (congratulation_choice IS NULL AND congratulation_companion IS NULL));
