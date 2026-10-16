import { PermissionTier, SecuritySessionState } from './types';

export class SecurityVault {
  // Default session expiration in minutes
  public static readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly MASTER_PIN = '2026'; // Competition Year Default PIN

  /**
   * Validates PIN entered by business owner
   */
  public static verifyPin(pin: string): boolean {
    return pin.trim() === this.MASTER_PIN;
  }

  /**
   * Generates a new 30-minute session object
   */
  public static createSession(): SecuritySessionState {
    const now = Date.now();
    return {
      isUnlocked: true,
      unlockedAt: now,
      expiresAt: now + this.SESSION_TIMEOUT_MS,
      timeoutMinutes: 30,
    };
  }

  /**
   * Checks whether the given session timestamp is still valid (< 30 mins)
   */
  public static isSessionValid(expiresAt: number | null): boolean {
    if (!expiresAt) return false;
    return Date.now() < expiresAt;
  }

  /**
   * Refreshes the sliding session for an additional 30 minutes
   */
  public static refreshSession(currentExpiresAt: number): number {
    return Date.now() + this.SESSION_TIMEOUT_MS;
  }

  /**
   * Enforces 4-Tier Security Matrix
   */
  public static checkPermission(tier: PermissionTier, isUnlocked: boolean): {
    allowed: boolean;
    reason?: string;
  } {
    switch (tier) {
      case 'Tier-1-Read':
        return { allowed: true }; // Read-only dashboard always accessible

      case 'Tier-2-Simulate':
        return { allowed: true }; // Safe simulations (what-if analysis)

      case 'Tier-3-Communicate':
        return {
          allowed: true, // Drafting messages is allowed, sending requires owner approval
        };

      case 'Tier-4-Execute':
        if (!isUnlocked) {
          return {
            allowed: false,
            reason: 'Security Vault Locked: এই সংবেদনশীল আর্থিক পরিবর্তনটি করতে ৩০ মিনিটের সিকিউরিটি পিন (PIN) আনলক প্রয়োজন।',
          };
        }
        return { allowed: true };

      default:
        return { allowed: false, reason: 'Unknown permission tier' };
    }
  }

  /**
   * PII Data Masker: Masks phone numbers, account numbers, and sensitive IDs
   * before sending to LLM APIs to satisfy Competition Security & Compliance rules.
   */
  public static maskPII(text: string): string {
    // Mask phone numbers (e.g. +8801711223344 -> +88017****3344)
    let sanitized = text.replace(/(\+?\d{3,4})(\d{4,6})(\d{2,4})/g, '$1****$3');
    // Mask national ID / Tax numbers
    sanitized = sanitized.replace(/\b(\d{4})[- ]?(\d{4})[- ]?(\d{4,6})\b/g, '$1-****-****');
    return sanitized;
  }
}
