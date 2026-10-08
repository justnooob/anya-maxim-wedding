-- Add a second active answer per existing cookie, retaining every existing RSVP.
ALTER TABLE rsvps ADD COLUMN submission_key uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE rsvps DROP CONSTRAINT rsvps_session_id_key;
CREATE UNIQUE INDEX rsvp_session_submission_unique ON rsvps(session_id,submission_key);
CREATE INDEX rsvp_session_idx ON rsvps(session_id);
-- Serialize all writes for a session and enforce the limit even outside the API.
CREATE FUNCTION enforce_rsvp_session_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.session_id=OLD.session_id THEN RETURN NEW; END IF;
 PERFORM id FROM guest_sessions WHERE id=NEW.session_id FOR UPDATE;
 IF (SELECT count(*) FROM rsvps WHERE session_id=NEW.session_id)>=2 THEN
  RAISE EXCEPTION 'Guest session capacity reached' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER rsvp_session_capacity BEFORE INSERT OR UPDATE OF session_id ON rsvps
 FOR EACH ROW EXECUTE FUNCTION enforce_rsvp_session_capacity();
