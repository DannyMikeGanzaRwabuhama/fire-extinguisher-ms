CREATE OR REPLACE FUNCTION notify_on_inspection_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'SCHEDULED' THEN
    -- Notify the user who scheduled the inspection
    INSERT INTO notifications(user_id, message, created_at, is_read)
    VALUES (
      NEW.user_id,
      'Dear ' || (SELECT first_name FROM users WHERE id = NEW.user_id)
      || ', an inspection for extinguisher '
      || (SELECT serial_number FROM extinguishers WHERE id = NEW.extinguisher_id)
      || ' at '
      || (SELECT location FROM extinguishers WHERE id = NEW.extinguisher_id)
      || ' has been scheduled for '
      || NEW.inspection_date || ' at ' || NEW.inspection_time || '.',
      NOW(),
      false
    );

    -- Notify the assigned inspector (if one is assigned and is not the scheduler)
    IF NEW.inspector_id IS NOT NULL AND NEW.inspector_id != NEW.user_id THEN
      INSERT INTO notifications(user_id, message, created_at, is_read)
      VALUES (
        NEW.inspector_id,
        'Dear ' || (SELECT first_name FROM users WHERE id = NEW.inspector_id)
        || ', an inspection for extinguisher '
        || (SELECT serial_number FROM extinguishers WHERE id = NEW.extinguisher_id)
        || ' at '
        || (SELECT location FROM extinguishers WHERE id = NEW.extinguisher_id)
        || ' has been scheduled for '
        || NEW.inspection_date || ' at ' || NEW.inspection_time || '.',
        NOW(),
        false
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS inspection_scheduled_trigger ON inspections;

CREATE TRIGGER inspection_scheduled_trigger
AFTER INSERT ON inspections
FOR EACH ROW EXECUTE FUNCTION notify_on_inspection_scheduled();
