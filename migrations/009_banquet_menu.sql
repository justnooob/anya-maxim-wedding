-- Nullable columns preserve all existing answers. New GOING requirements are
-- validated by the API; legacy guests do not get invented menu selections.
ALTER TABLE rsvps ADD COLUMN hot_appetizer_choice text;
ALTER TABLE rsvps ADD COLUMN main_course_choice text;
ALTER TABLE rsvps ADD CONSTRAINT rsvp_hot_appetizer_values CHECK (hot_appetizer_choice IS NULL OR hot_appetizer_choice IN ('hot_meat','hot_fish'));
ALTER TABLE rsvps ADD CONSTRAINT rsvp_main_course_values CHECK (main_course_choice IS NULL OR main_course_choice IN ('main_meat','main_fish'));
ALTER TABLE rsvps ADD CONSTRAINT rsvp_no_menu CHECK (attendance='yes' OR (hot_appetizer_choice IS NULL AND main_course_choice IS NULL));
