import { useCallback, useEffect, useMemo, useState } from 'react';
import { savedContactsApi, type SavedContact } from '../api/client';
import {
  contactKey,
  formatPhoneDisplay,
  isValidPhone,
  normalizePhone,
  pickPhoneContacts,
  supportsContactPicker,
} from '../utils/contacts';

export interface Recipient {
  phone: string;
  name: string;
}

interface ContactPickerProps {
  sessionId: string;
  selected: Recipient[];
  onChange: (recipients: Recipient[]) => void;
}

export function ContactPicker({ sessionId, selected, onChange }: ContactPickerProps) {
  const [saved, setSaved] = useState<SavedContact[]>([]);
  const [search, setSearch] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedKeys = useMemo(() => new Set(selected.map(r => contactKey(r.phone))), [selected]);

  const loadSaved = useCallback(async (q?: string) => {
    try {
      const { data } = await savedContactsApi.list(sessionId, q);
      setSaved(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSaved(search.trim() || undefined);
    }, 200);
    return () => clearTimeout(timer);
  }, [search, loadSaved]);

  const persistContacts = async (contacts: { phone: string; name?: string }[]) => {
    if (!contacts.length) return;
    try {
      const { data } = await savedContactsApi.upsert(sessionId, { contacts });
      setSaved(prev => {
        const byPhone = new Map(prev.map(c => [c.phone, c]));
        for (const c of data) byPhone.set(c.phone, c);
        return [...byPhone.values()].sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch {
      // ponytail: scheduling still works if save fails
    }
  };

  const addRecipients = (incoming: Recipient[]) => {
    const next = [...selected];
    const keys = new Set(next.map(r => contactKey(r.phone)));
    for (const r of incoming) {
      const key = contactKey(r.phone);
      if (!keys.has(key)) {
        keys.add(key);
        next.push(r);
      }
    }
    onChange(next);
    void persistContacts(incoming);
  };

  const toggleContact = (contact: SavedContact) => {
    const key = contactKey(contact.phone);
    if (selectedKeys.has(key)) {
      onChange(selected.filter(r => contactKey(r.phone) !== key));
    } else {
      addRecipients([{ phone: contact.phone, name: contact.name }]);
    }
  };

  const removeRecipient = (phone: string) => {
    const key = contactKey(phone);
    onChange(selected.filter(r => contactKey(r.phone) !== key));
  };

  const handlePickFromPhone = async () => {
    setPicking(true);
    setError(null);
    try {
      const picked = await pickPhoneContacts();
      if (!picked.length) return;
      addRecipients(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read phone contacts');
    } finally {
      setPicking(false);
    }
  };

  const handleAddManual = () => {
    const phone = normalizePhone(manualPhone);
    if (!isValidPhone(phone)) {
      setError('Enter a valid phone number (10+ digits)');
      return;
    }
    setError(null);
    addRecipients([{ phone, name: phone }]);
    setManualPhone('');
  };

  const handleRemoveSaved = async (e: React.MouseEvent, contact: SavedContact) => {
    e.stopPropagation();
    try {
      await savedContactsApi.remove(sessionId, contact.id);
      setSaved(prev => prev.filter(c => c.id !== contact.id));
      removeRecipient(contact.phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove contact');
    }
  };

  return (
    <div className="contact-picker">
      {selected.length > 0 && (
        <div className="selected-chips" role="list" aria-label="Selected recipients">
          {selected.map(r => (
            <span key={contactKey(r.phone)} className="contact-chip" role="listitem">
              <span className="chip-label">{r.name !== r.phone ? r.name : formatPhoneDisplay(r.phone)}</span>
              {r.name !== r.phone && <span className="chip-phone">{formatPhoneDisplay(r.phone)}</span>}
              <button
                type="button"
                className="chip-remove"
                onClick={() => removeRecipient(r.phone)}
                aria-label={`Remove ${r.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="contact-actions">
        {supportsContactPicker() && (
          <button type="button" className="btn-secondary" onClick={() => void handlePickFromPhone()} disabled={picking}>
            {picking ? 'Opening…' : 'From phone'}
          </button>
        )}
        <div className="manual-add-row">
          <input
            type="tel"
            inputMode="tel"
            placeholder="Add number"
            value={manualPhone}
            onChange={e => setManualPhone(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddManual();
              }
            }}
            aria-label="Phone number to add"
          />
          <button type="button" className="btn-secondary" onClick={handleAddManual}>
            Add
          </button>
        </div>
      </div>

      <input
        type="search"
        className="contact-search"
        placeholder="Search saved contacts"
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search contacts"
      />

      <div className="contact-list" role="listbox" aria-label="Saved contacts" aria-multiselectable="true">
        {loading && <p className="contact-list-empty">Loading contacts…</p>}
        {!loading && saved.length === 0 && (
          <p className="contact-list-empty">
            {search ? 'No matches' : 'No saved contacts yet — pick from phone or add a number'}
          </p>
        )}
        {saved.map(contact => {
          const checked = selectedKeys.has(contactKey(contact.phone));
          return (
            <div
              key={contact.id}
              className={`contact-row${checked ? ' selected' : ''}`}
              role="option"
              aria-selected={checked}
              onClick={() => toggleContact(contact)}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleContact(contact)}
                onClick={e => e.stopPropagation()}
                aria-label={`Select ${contact.name}`}
              />
              <div className="contact-row-info">
                <span className="contact-row-name">{contact.name}</span>
                <span className="contact-row-phone">{formatPhoneDisplay(contact.phone)}</span>
              </div>
              <button
                type="button"
                className="contact-row-delete"
                onClick={e => void handleRemoveSaved(e, contact)}
                aria-label={`Delete ${contact.name}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}
      <span className="field-hint">
        {selected.length} recipient{selected.length !== 1 ? 's' : ''} selected
      </span>
    </div>
  );
}
