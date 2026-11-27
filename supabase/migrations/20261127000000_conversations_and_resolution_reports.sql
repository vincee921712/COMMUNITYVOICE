ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS resolution_report JSONB,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS first_official_response_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE public.certification_requests
ADD COLUMN IF NOT EXISTS status_history JSONB NOT NULL DEFAULT '[]'::JSONB;

CREATE TABLE IF NOT EXISTS public.record_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type TEXT NOT NULL CHECK (record_type IN ('complaint', 'request')),
    tracking_number TEXT NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_record_messages_tracking
ON public.record_messages (tracking_number, created_at);

ALTER TABLE public.record_messages
ADD COLUMN IF NOT EXISTS sender_role TEXT,
ADD COLUMN IF NOT EXISTS sender_name TEXT;

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('complaint', 'request', 'system')),
    tracking_number TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id OR public.is_staff_or_official(auth.uid()));

CREATE POLICY "Authorized users create notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.is_staff_or_official(auth.uid()) OR auth.uid() = user_id);

ALTER TABLE public.record_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Residents view own conversation records"
ON public.record_messages FOR SELECT
USING (
    (
        record_type = 'complaint'
        AND EXISTS (
            SELECT 1 FROM public.complaints c
            WHERE c.tracking_number = record_messages.tracking_number
              AND c.resident_id = auth.uid()
        )
    )
    OR (
        record_type = 'request'
        AND EXISTS (
            SELECT 1 FROM public.certification_requests r
            WHERE r.tracking_number = record_messages.tracking_number
              AND r.resident_id = auth.uid()
        )
    )
    OR public.is_staff_or_official(auth.uid())
);

CREATE POLICY "Authorized users can create conversation messages"
ON public.record_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid()
    AND (
        public.is_staff_or_official(auth.uid())
        OR (
            record_type = 'complaint'
            AND EXISTS (
                SELECT 1 FROM public.complaints c
                WHERE c.tracking_number = record_messages.tracking_number
                  AND c.resident_id = auth.uid()
            )
        )
        OR (
            record_type = 'request'
            AND EXISTS (
                SELECT 1 FROM public.certification_requests r
                WHERE r.tracking_number = record_messages.tracking_number
                  AND r.resident_id = auth.uid()
            )
        )
    )
);

CREATE OR REPLACE FUNCTION public.track_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS trg_track_complaint_status_change ON public.complaints;
CREATE TRIGGER trg_track_complaint_status_change
BEFORE UPDATE OF status, resolution_report ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.track_complaint_status_change();

CREATE OR REPLACE FUNCTION public.notify_complaint_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS trg_notify_complaint_status_change ON public.complaints;
CREATE TRIGGER trg_notify_complaint_status_change
AFTER UPDATE OF status ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.notify_complaint_status_change();
