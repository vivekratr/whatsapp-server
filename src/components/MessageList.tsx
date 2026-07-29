import { scheduledApi, type ScheduledMessage, type ScheduledMessageStatus } from '../api/client';
import { formatPhoneDisplay } from '../utils/contacts';

interface MessageListProps {
  sessionId: string;
  messages: ScheduledMessage[];
  filter: 'scheduled' | 'sent';
  loading: boolean;
  onRefresh: () => void;
  onCancel: () => void;
}

const SCHEDULED_STATUSES: ScheduledMessageStatus[] = ['pending', 'queued', 'sending'];
const SENT_STATUSES: ScheduledMessageStatus[] = ['completed', 'failed', 'cancelled'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function messagePreview(msg: ScheduledMessage): string {
  const text = msg.content?.text ?? msg.content?.caption;
  if (text) return text;
  return msg.messageType;
}

function formatRecipients(recipients: string[] | undefined, count: number): string {
  if (recipients?.length) return recipients.map(formatPhoneDisplay).join(', ');
  return `${count} recipient${count !== 1 ? 's' : ''}`;
}
function statusLabel(status: ScheduledMessageStatus): string {
  const labels: Record<ScheduledMessageStatus, string> = {
    pending: 'Pending',
    queued: 'Queued',
    sending: 'Sending',
    completed: 'Sent',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

export function MessageList({ sessionId, messages, filter, loading, onRefresh, onCancel }: MessageListProps) {
  const filtered = messages.filter(m =>
    filter === 'scheduled'
      ? SCHEDULED_STATUSES.includes(m.status)
      : SENT_STATUSES.includes(m.status),
  );

  const handleCancel = async (id: string) => {
    try {
      await scheduledApi.cancel(sessionId, id);
      onCancel();
    } catch {
      // ignore
    }
  };

  return (
    <div className="message-list">
      <div className="list-header">
        <button className="btn-text" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {loading && filtered.length === 0 ? (
        <div className="empty-state">
          <span className="spinner" aria-hidden="true" />
          <span>Loading</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>{filter === 'scheduled' ? 'No scheduled messages' : 'No sent messages yet'}</p>
        </div>
      ) : (
        <ul className="message-rows">
          {filtered.map(msg => (
            <li key={msg.id} className="message-row">
              <div className="row-top">
                <span className="row-status">{statusLabel(msg.status)}</span>
                <span className="row-date">{formatDate(msg.scheduledAt)}</span>
              </div>
              <p className="row-contacts">{formatRecipients(msg.recipients, msg.recipientCount)}</p>
              <p className="row-message">{messagePreview(msg)}</p>
              {msg.errorMessage && <p className="error-text">{msg.errorMessage}</p>}
              {filter === 'scheduled' && (msg.status === 'pending' || msg.status === 'queued') && (
                <button className="btn-text danger" onClick={() => handleCancel(msg.id)}>
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
