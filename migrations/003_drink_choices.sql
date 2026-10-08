-- Keep legacy wine values without guessing the guest's preferred colour.
ALTER TABLE rsvps DROP CONSTRAINT rsvp_alcohol_choices, DROP CONSTRAINT rsvp_soft_choices;
ALTER TABLE rsvps
ADD CONSTRAINT rsvp_alcohol_choices CHECK (alcohol_drinks <@ ARRAY['wine','red_wine','white_wine','cognac','vodka','whisky','rum','gin','jagermeister','other','none']::text[] AND cardinality(alcohol_drinks)<=11 AND array_position(alcohol_drinks,NULL) IS NULL),
ADD CONSTRAINT rsvp_soft_choices CHECK (soft_drinks <@ ARRAY['cola','sprite','fanta','tonic','apple_juice','multifruit_juice','orange_juice','tomato_juice','sparkling_water','still_water','other','none']::text[] AND cardinality(soft_drinks)<=12 AND array_position(soft_drinks,NULL) IS NULL);
