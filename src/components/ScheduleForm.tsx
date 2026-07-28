import { useState } from 'react';
import { scheduledApi } from '../api/client';
import { ContactPicker, type Recipient } from './ContactPicker';

interface ScheduleFormProps {
  sessionId: string;
  onScheduled: () => void;
}

function toDateValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toTimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScheduleForm({ sessionId, onScheduled }: ScheduleFormProps) {
  const defaultDate = new Date(Date.now() + 5 * 60 * 1000);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(toDateValue(defaultDate));
  const [time, setTime] = useState(toTimeValue(defaultDate));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = recipients.length > 0 && message.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError('Invalid date or time');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await scheduledApi.create(sessionId, {
        scheduledAt: scheduledAt.toISOString(),
        recipients: recipients.map(r => r.phone),
        messageType: 'text',
        content: { text: message.trim() },
      });

      setRecipients([]);
      setMessage('');
      setSuccess(true);
      onScheduled();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="schedule-form" onSubmit={handleSubmit}>
      <div className="form-card">
        <div className="form-field">
          <label className="label-text">To</label>
          <ContactPicker sessionId={sessionId} selected={recipients} onChange={setRecipients} />
        </div>
      </div>

      <div className="form-card">
        <div className="form-field">
          <label className="label-text" htmlFor="message">Message</label>
          <textarea
            id="message"
            rows={4}
            placeholder="Type a message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-card">
        <div className="form-field">
          <label className="label-text">Send at</label>
          <div className="datetime-row">
            <input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              aria-label="Date"
              required
            />
            <input
              id="time"
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              aria-label="Time"
              required
            />
          </div>
        </div>
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}
      {success && <p className="success-text" role="status">Message scheduled</p>}

      <div className="form-footer">
        <button type="submit" className="btn-primary" disabled={loading || !canSubmit}>
          {loading ? 'Scheduling…' : 'Schedule message'}
        </button>
      </div>
    </form>
  );
}
