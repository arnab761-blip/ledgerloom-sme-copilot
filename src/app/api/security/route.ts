import { NextResponse } from 'next/server';
import { SecurityVault } from '@/lib/security-vault';

export async function POST(req: Request) {
  try {
    const { action, pin, expiresAt } = await req.json();

    if (action === 'verify_pin') {
      const isValid = SecurityVault.verifyPin(pin || '');
      if (isValid) {
        const session = SecurityVault.createSession();
        return NextResponse.json({ success: true, session });
      } else {
        return NextResponse.json(
          { success: false, error: 'ভুল পিন (PIN) কোড! অনুগ্রহ করে আপনার সঠিক ৪-ডিজিটের পিন প্রদান করুন।' },
          { status: 401 }
        );
      }
    }

    if (action === 'change_pin') {
      const { newPin } = await req.json();
      const updated = SecurityVault.setPin(newPin);
      return NextResponse.json({ success: updated });
    }

    if (action === 'check_session') {
      const valid = SecurityVault.isSessionValid(expiresAt);
      return NextResponse.json({
        success: true,
        valid,
        remainingMinutes: valid
          ? Math.max(0, Math.round((expiresAt - Date.now()) / 60000))
          : 0,
      });
    }

    if (action === 'refresh_session') {
      const newExpiresAt = SecurityVault.refreshSession(expiresAt || Date.now());
      return NextResponse.json({ success: true, expiresAt: newExpiresAt });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
