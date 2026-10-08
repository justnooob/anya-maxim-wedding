-- Preserve historical answers exceeding the new limits. NOT VALID skips legacy rows,
-- while PostgreSQL enforces these constraints on every new insert/update.
-- No reset, truncation, deletion or rewriting of previously applied migrations.
ALTER TABLE rsvps ADD CONSTRAINT rsvp_text_limits_v2 CHECK (
 char_length(guest_name) BETWEEN 1 AND 80 AND char_length(who)<=120
 AND char_length(food)<=300 AND (music_request IS NULL OR char_length(music_request)<=300)
 AND char_length(alcohol_other)<=80 AND char_length(soft_other)<=80
) NOT VALID;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_going_required_v2 CHECK (
 attendance='no' OR (char_length(btrim(who))>0 AND cardinality(alcohol_drinks)>0 AND cardinality(soft_drinks)>0)
) NOT VALID;
