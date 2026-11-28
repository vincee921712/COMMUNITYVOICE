ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS assigned_role_label TEXT;

ALTER TABLE public.certification_requests
ADD COLUMN IF NOT EXISTS approved_by_name TEXT;

CREATE OR REPLACE FUNCTION public.is_staff_or_official(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id AND role IN ('staff', 'official', 'admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.track_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  changed_by_name TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'Resolved' AND NEW.resolution_report IS NULL THEN
      RAISE EXCEPTION 'An incident resolution report is required before resolving a complaint';
    END IF;
    SELECT full_name INTO changed_by_name
    FROM public.profiles
    WHERE id = auth.uid();

    NEW.status_history := COALESCE(OLD.status_history, '[]'::JSONB) || jsonb_build_array(
      jsonb_build_object(
        'status', NEW.status,
        'changed_at', NOW(),
        'changed_by', COALESCE(changed_by_name, 'Barangay Staff')
      )
    );

    IF NEW.status = 'Assigned' AND OLD.assigned_at IS NULL THEN
      NEW.assigned_at := NOW();
    END IF;
    IF NEW.status = 'Resolved' AND OLD.resolved_at IS NULL THEN
      NEW.resolved_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.resident_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id, record_type, tracking_number, title, message
    ) VALUES (
      NEW.resident_id,
      'complaint',
      NEW.tracking_number,
      'Complaint status updated',
      format('Your complaint %s is now %s.', NEW.tracking_number, NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;
