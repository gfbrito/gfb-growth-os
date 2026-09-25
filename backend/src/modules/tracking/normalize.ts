import crypto from "node:crypto";

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function normalizeEmail(email?: string | null): string | null {
  if (!email || typeof email !== "string") return null;
  const clean = email.trim().toLowerCase();
  return clean.includes("@") ? clean : null;
}

/**
 * Normalizes Brazilian phone numbers into E.164 (+55DD9XXXXXXXX)
 */
export function normalizePhoneBR(phone?: string | null): string | null {
  if (!phone || typeof phone !== "string") return null;

  // Keep only numbers
  let digits = phone.replace(/\D/g, "");

  // If already starts with 55 and has 12 or 13 digits
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    // Check 9th digit insertion if needed
    if (digits.length === 12) {
      // 55 + 2 digits DDD + 8 digits phone -> insert 9
      digits = digits.slice(0, 4) + "9" + digits.slice(4);
    }
    return `+${digits}`;
  }

  // DDD + 8 digits (10 digits) -> insert 9th digit
  if (digits.length === 10) {
    digits = digits.slice(0, 2) + "9" + digits.slice(2);
    return `+55${digits}`;
  }

  // DDD + 9 digits (11 digits)
  if (digits.length === 11) {
    return `+55${digits}`;
  }

  // Fallback if foreign or already has full digits
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export interface UserDataPayload {
  em?: string[]; // Hashed email
  ph?: string[]; // Hashed phone
  fn?: string[]; // Hashed first name
  ln?: string[]; // Hashed last name
  fbp?: string;  // Plain _fbp
  fbc?: string;  // Plain _fbc
  client_ip_address?: string;
  client_user_agent?: string;
  external_id?: string[];
}

export function buildMetaUserData(params: {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  externalId?: string | null;
}): UserDataPayload {
  const userData: UserDataPayload = {};

  const cleanEmail = normalizeEmail(params.email);
  if (cleanEmail) {
    userData.em = [sha256(cleanEmail)];
  }

  const cleanPhone = normalizePhoneBR(params.phone);
  if (cleanPhone) {
    userData.ph = [sha256(cleanPhone.replace(/\D/g, ""))];
  }

  if (params.name) {
    const parts = params.name.trim().split(/\s+/);
    if (parts[0]) userData.fn = [sha256(parts[0])];
    if (parts.length > 1) userData.ln = [sha256(parts.slice(1).join(" "))];
  }

  if (params.fbp) userData.fbp = params.fbp;
  if (params.fbc) userData.fbc = params.fbc;
  if (params.ipAddress) userData.client_ip_address = params.ipAddress;
  if (params.userAgent) userData.client_user_agent = params.userAgent;
  if (params.externalId) userData.external_id = [sha256(params.externalId)];

  return userData;
}
