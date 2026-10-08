ALTER TABLE rsvps ADD COLUMN music_request text;
ALTER TABLE rsvps
  ADD CONSTRAINT rsvp_music_length CHECK (music_request IS NULL OR char_length(music_request)<=1000),
  ADD CONSTRAINT rsvp_no_music CHECK (attendance='yes' OR music_request IS NULL);
