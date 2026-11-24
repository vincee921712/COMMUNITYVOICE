export interface DispatchedSms {
  id: string;
  recipient: string;
  recipientName?: string;
  refNumber?: string;
  trigger: 'complaint_assigned' | 'certificate_ready' | 'captain_alert' | 'complaint_submitted' | 'certificate_submitted' | 'custom_alert';
  message: string;
  mode: 'live' | 'test' | 'simulated_fallback' | 'simulated_offline';
  status: 'Sent (Live)' | 'Simulated' | 'Failed';
  timestamp: string;
}

export interface SmsDispatchOptions {
  to: string;
  message: string;
  trigger?: DispatchedSms['trigger'];
  recipientName?: string;
  refNumber?: string;
}

/**
 * Normalizes PH phone numbers for clean presentation
 */
export function formatPhilippinePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('09')) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Dispatches an SMS via internal Next.js API route that connects to Semaphore
 */
export async function sendSmsDispatch(options: SmsDispatchOptions): Promise<DispatchedSms | null> {
  const { to, message, trigger = 'custom_alert', recipientName, refNumber } = options;

  if (!to || !to.trim() || !message || !message.trim()) {
    return null;
  }

  try {
    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        message,
        trigger,
        recipientName,
        refNumber,
      }),
    });

    const result = await res.json();

    const record: DispatchedSms = {
      id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient: result.recipient || to,
      recipientName: recipientName || 'Resident / Official',
      refNumber,
      trigger,
      message,
      mode: result.mode || 'test',
      status: result.mode === 'live' ? 'Sent (Live)' : 'Simulated',
      timestamp: new Date().toISOString(),
    };

    // Save to local SMS Outbox history
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cv_dispatched_sms');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(record);
        // Keep latest 50 SMS entries
        localStorage.setItem('cv_dispatched_sms', JSON.stringify(list.slice(0, 50)));
        // Dispatch window event so Navbar updates reactively
        window.dispatchEvent(new Event('cv_sms_updated'));
      } catch (err) {
        console.warn('Failed to cache SMS to local storage:', err);
      }
    }

    return record;
  } catch (err) {
    console.error('Error dispatching SMS:', err);

    // Fallback record in case API fetch fails
    const fallbackRecord: DispatchedSms = {
      id: `sms-${Date.now()}`,
      recipient: to,
      recipientName,
      refNumber,
      trigger,
      message,
      mode: 'test',
      status: 'Simulated',
      timestamp: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('cv_dispatched_sms');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(fallbackRecord);
        localStorage.setItem('cv_dispatched_sms', JSON.stringify(list.slice(0, 50)));
        window.dispatchEvent(new Event('cv_sms_updated'));
      } catch {}
    }

    return fallbackRecord;
  }
}

/**
 * Trigger 1: Complaint assigned to a Kagawad/Staff
 */
export async function notifyComplaintAssigned(
  contact: string,
  trackingNumber: string,
  assignedOfficial: string,
  priority: string,
  residentName?: string
) {
  const message = `[Barangay Hibao-an Sur CommunityVoice] Maayong adlaw! Your complaint Ref: ${trackingNumber} has been verified and assigned to ${assignedOfficial} (Priority: ${priority}). View updates at: https://hibao-an-sur.gov.ph/track?id=${trackingNumber}`;
  return sendSmsDispatch({
    to: contact,
    message,
    trigger: 'complaint_assigned',
    recipientName: residentName,
    refNumber: trackingNumber,
  });
}

/**
 * Trigger 2: Certificate approved and ready for pickup
 */
export async function notifyCertificateReady(
  contact: string,
  trackingNumber: string,
  certificateType: string,
  residentName?: string
) {
  const typeLabel =
    certificateType === 'certificate_of_indigency'
      ? 'Certificate of Indigency'
      : certificateType === 'certificate_of_residency'
      ? 'Certificate of Residency'
      : 'Barangay ID';

  const message = `[Barangay Hibao-an Sur CommunityVoice] Good news! Your ${typeLabel} (Ref: ${trackingNumber}) has been APPROVED by the Punong Barangay and is READY FOR PICKUP at Barangay Hall Window 1. Please present 1 valid ID.`;

  return sendSmsDispatch({
    to: contact,
    message,
    trigger: 'certificate_ready',
    recipientName: residentName,
    refNumber: trackingNumber,
  });
}

/**
 * Trigger 3: High Priority Incident Alert to Punong Barangay / Tanod Dispatch
 */
export async function notifyCaptainHighPriorityAlert(
  captainContact: string,
  trackingNumber: string,
  title: string,
  location: string,
  priority: string = 'High'
) {
  const message = `[URGENT DISPATCH - Barangay Hibao-an Sur] ${priority.toUpperCase()} PRIORITY ALERT: Incident "${title}" reported at ${location}. Reference: ${trackingNumber}. Tanod inspection requested immediately.`;

  return sendSmsDispatch({
    to: captainContact || '0917-555-0100', // Default official dispatch line
    message,
    trigger: 'captain_alert',
    recipientName: 'Hon. Roberto Perez (Punong Barangay)',
    refNumber: trackingNumber,
  });
}

/**
 * Trigger 4: Complaint Submitted Acknowledgment to Resident
 */
export async function notifyComplaintSubmitted(
  contact: string,
  trackingNumber: string,
  title: string,
  residentName?: string
) {
  const message = `[Barangay Hibao-an Sur CommunityVoice] Salamat! Your incident report "${title}" was recorded. Reference Tracking: ${trackingNumber}. Monitor real-time status at: https://hibao-an-sur.gov.ph/track?id=${trackingNumber}`;

  return sendSmsDispatch({
    to: contact,
    message,
    trigger: 'complaint_submitted',
    recipientName: residentName,
    refNumber: trackingNumber,
  });
}

/**
 * Trigger 5: Certificate Requested Acknowledgment to Resident
 */
export async function notifyCertificateSubmitted(
  contact: string,
  trackingNumber: string,
  certificateType: string,
  residentName?: string
) {
  const message = `[Barangay Hibao-an Sur] Your request for ${certificateType} (Tracking: ${trackingNumber}) has been submitted for review. Standard turnaround is within 48 hours.`;

  return sendSmsDispatch({
    to: contact,
    message,
    trigger: 'certificate_submitted',
    recipientName: residentName,
    refNumber: trackingNumber,
  });
}

/**
 * Retrieves all stored SMS logs
 */
export function getStoredSmsLogs(): DispatchedSms[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('cv_dispatched_sms');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('Error reading stored SMS logs:', err);
  }
  return [
    {
      id: 'sms-seed-1',
      recipient: '0917-555-0192',
      recipientName: 'Maria Santos',
      refNumber: 'CV-2026-001',
      trigger: 'complaint_assigned',
      message: '[Barangay Hibao-an Sur] Your complaint CV-2026-001 has been assigned to Kagawad on Public Utilities.',
      mode: 'live',
      status: 'Sent (Live)',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'sms-seed-2',
      recipient: '0928-555-4819',
      recipientName: 'Eduardo Ramos',
      refNumber: 'CERT-2026-001',
      trigger: 'certificate_ready',
      message: '[Barangay Hibao-an Sur] Certificate of Indigency CERT-2026-001 is READY FOR PICKUP at Window 1.',
      mode: 'test',
      status: 'Simulated',
      timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    },
  ];
}
