import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

interface SmsRequestBody {
  to: string;
  message: string;
  trigger?: string;
  recipientName?: string;
  refNumber?: string;
}

const dispatchCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const window = dispatchCounts.get(key);
  if (!window || window.resetAt <= now) {
    dispatchCounts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  window.count += 1;
  return window.count > 20;
}

/**
 * Normalizes Philippine mobile numbers to 11 digits format: '09XXXXXXXXX'
 */
function normalizePhilippineNumber(phone: string): string {
  // Strip all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Case 1: Already 11 digits starting with 09 (e.g. 09171234567)
  if (cleaned.length === 11 && cleaned.startsWith('09')) {
    return cleaned;
  }

  // Case 2: 12 digits starting with 639 (e.g. 639171234567)
  if (cleaned.length === 12 && cleaned.startsWith('639')) {
    return '0' + cleaned.slice(2);
  }

  // Case 3: 10 digits starting with 9 (e.g. 9171234567)
  if (cleaned.length === 10 && cleaned.startsWith('9')) {
    return '0' + cleaned;
  }

  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Authentication is unavailable.' }, { status: 503 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => undefined,
      },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    if (isRateLimited(user.id)) {
      return NextResponse.json({ error: 'Too many SMS dispatch requests.' }, { status: 429 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, phone_number')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Could not verify account permissions.' }, { status: 403 });
    }

    const body = (await request.json()) as SmsRequestBody;
    const { to, message, trigger, recipientName, refNumber } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Recipient phone number and message are required.' },
        { status: 400 }
      );
    }

    const normalizedNumber = normalizePhilippineNumber(to);
    const isValidFormat = /^09\d{9}$/.test(normalizedNumber);
    if (!isValidFormat) {
      return NextResponse.json({ error: 'A valid Philippine mobile number is required.' }, { status: 400 });
    }

    const isStaff = ['staff', 'official', 'admin'].includes(profile.role);
    const residentAcknowledgement = trigger === 'complaint_submitted' || trigger === 'certificate_submitted';
    if (!isStaff && !residentAcknowledgement) {
      return NextResponse.json({ error: 'You are not authorized to dispatch this SMS.' }, { status: 403 });
    }
    if (!isStaff) {
      const profileNumber = normalizePhilippineNumber(profile.phone_number || '');
      if (profileNumber !== normalizedNumber) {
        return NextResponse.json({ error: 'SMS recipients must match your registered mobile number.' }, { status: 403 });
      }
    }

    const apiKey = process.env.SEMAPHORE_API_KEY;
    const smsMode = (process.env.NEXT_PUBLIC_SMS_MODE || 'test').toLowerCase();
    const senderName = process.env.SEMAPHORE_SENDER_NAME;

    // Check if live API key is provided and not default placeholder
    const isLiveApiKey =
      apiKey &&
      apiKey !== 'your_semaphore_key_here' &&
      apiKey.trim().length > 5;

    // If live credentials are provided and mode is live or auto-detected
    if (isLiveApiKey && smsMode !== 'test_forced') {
      try {
        const semaphoreParams = new URLSearchParams();
        semaphoreParams.append('apikey', apiKey);
        semaphoreParams.append('number', normalizedNumber);
        semaphoreParams.append('message', message);
        if (senderName) {
          semaphoreParams.append('sendername', senderName);
        }

        const response = await fetch('https://api.semaphore.co/api/v4/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: semaphoreParams.toString(),
        });

        const data = await response.json();

        if (response.ok) {
          return NextResponse.json({
            success: true,
            mode: 'live',
            provider: 'Semaphore SMS Gateway',
            recipient: normalizedNumber,
            recipientName,
            refNumber,
            trigger: trigger || 'system_alert',
            message,
            timestamp: new Date().toISOString(),
            data,
          });
        } else {
          console.warn('Semaphore API returned error, falling back to simulated receipt:', data);
          return NextResponse.json({
            success: true,
            mode: 'simulated_fallback',
            provider: 'Semaphore (Fallback)',
            recipient: normalizedNumber,
            recipientName,
            refNumber,
            trigger: trigger || 'system_alert',
            message,
            timestamp: new Date().toISOString(),
            errorNotice: data?.message || 'Semaphore API rate-limit or credit check',
          });
        }
      } catch (networkError: unknown) {
        console.error('Failed to reach Semaphore SMS endpoint:', networkError);
        // Graceful fallback so local offline dev or testing continues uninterrupted
        return NextResponse.json({
          success: true,
          mode: 'simulated_offline',
          provider: 'Semaphore Offline Simulator',
          recipient: normalizedNumber,
          recipientName,
          refNumber,
          trigger: trigger || 'system_alert',
          message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Default: Test / Simulation Mode (Active when no Semaphore key is entered)
    return NextResponse.json({
      success: true,
      mode: 'test',
      provider: 'CommunityVoice SMS Simulator',
      recipient: isValidFormat ? normalizedNumber : to,
      recipientName,
      refNumber,
      trigger: trigger || 'system_alert',
      message,
      timestamp: new Date().toISOString(),
      note: 'Simulated SMS dispatch. Add a valid SEMAPHORE_API_KEY in .env.local to dispatch real cellular SMS messages in the Philippines.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Failed to process SMS request', details: errorMsg },
      { status: 500 }
    );
  }
}
