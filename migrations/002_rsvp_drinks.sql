ALTER TABLE rsvps
  ADD COLUMN alcohol_drinks text[] NOT NULL DEFAULT '{}',
  ADD COLUMN alcohol_other text NOT NULL DEFAULT '',
  ADD COLUMN soft_drinks text[] NOT NULL DEFAULT '{}',
  ADD COLUMN soft_other text NOT NULL DEFAULT '';
ALTER TABLE rsvps
  ADD CONSTRAINT rsvp_alcohol_choices CHECK (alcohol_drinks <@ ARRAY['wine','cognac','vodka','whisky','rum','gin','jagermeister','other','none']::text[] AND cardinality(alcohol_drinks)<=9 AND array_position(alcohol_drinks,NULL) IS NULL),
  ADD CONSTRAINT rsvp_soft_choices CHECK (soft_drinks <@ ARRAY['cola','sprite','fanta','apple_juice','multifruit_juice','orange_juice','sparkling_water','still_water','other','none']::text[] AND cardinality(soft_drinks)<=10 AND array_position(soft_drinks,NULL) IS NULL),
  ADD CONSTRAINT rsvp_alcohol_none CHECK (NOT ('none'=ANY(alcohol_drinks)) OR cardinality(alcohol_drinks)=1),
  ADD CONSTRAINT rsvp_soft_none CHECK (NOT ('none'=ANY(soft_drinks)) OR cardinality(soft_drinks)=1),
  ADD CONSTRAINT rsvp_drink_other_length CHECK (char_length(alcohol_other)<=120 AND char_length(soft_other)<=120),
  ADD CONSTRAINT rsvp_drink_other_required CHECK (
    (('other'=ANY(alcohol_drinks)) AND char_length(btrim(alcohol_other))>0 OR NOT ('other'=ANY(alcohol_drinks)) AND alcohol_other='') AND
    (('other'=ANY(soft_drinks)) AND char_length(btrim(soft_other))>0 OR NOT ('other'=ANY(soft_drinks)) AND soft_other='')),
  ADD CONSTRAINT rsvp_no_drinks CHECK (attendance='yes' OR (cardinality(alcohol_drinks)=0 AND cardinality(soft_drinks)=0 AND alcohol_other='' AND soft_other=''));
