export interface SavedContact {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface PickedContact {
  phone: string;
  name: string;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidPhone(phone: string): boolean {
  return normalizePhone(phone).length >= 10;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length <= 10) return digits;
  return `+${digits}`;
}

export function contactKey(phone: string): string {
  return normalizePhone(phone);
}

export function supportsContactPicker(): boolean {
  return 'contacts' in navigator && typeof navigator.contacts?.select === 'function';
}

export async function pickPhoneContacts(): Promise<PickedContact[]> {
  if (!supportsContactPicker()) {
    throw new Error('Phone contacts not supported in this browser');
  }

  const picked = await navigator.contacts!.select(['name', 'tel'], { multiple: true });
  const results: PickedContact[] = [];

  for (const contact of picked) {
    const name =
      contact.name?.[0]?.formatted?.[0] ||
      [contact.name?.[0]?.given?.[0], contact.name?.[0]?.family?.[0]].filter(Boolean).join(' ') ||
      '';

    for (const tel of contact.tel ?? []) {
      const phone = normalizePhone(tel);
      if (phone.length >= 10) {
        results.push({ phone, name: name || phone });
      }
    }
  }

  return results;
}
