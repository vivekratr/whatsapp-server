import { useCallback, useEffect, useState } from 'react';
import { scheduledApi, type ScheduledMessage, type ScheduledMessageStatus } from '../api/client';

const ACTIVE_STATUSES: ScheduledMessageStatus[] = ['pending', 'queued', 'sending'];

function pollMs(messages: ScheduledMessage[]): number | null {
  const active = messages.filter(m => ACTIVE_STATUSES.includes(m.status));
  if (active.length === 0) return null;
  if (active.some(m => m.status === 'sending')) return 3_000;
  if (active.some(m => m.status === 'queued')) return 10_000;
  return 30_000;
}

export function useScheduledMessages(sessionId: string | undefined, enabled = true) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!sessionId) return;
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const result = await scheduledApi.list(sessionId, { limit: 50 });
        setMessages(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [sessionId],
  );

  useEffect(() => {
    if (sessionId && enabled) {
      void load();
    }
  }, [sessionId, enabled, load]);

  useEffect(() => {
    const ms = pollMs(messages);
    if (!sessionId || !enabled || ms === null) return;

    const id = setInterval(() => void load({ silent: true }), ms);
    return () => clearInterval(id);
  }, [sessionId, enabled, messages, load]);

  return { messages, loading, error, reload: load };
}
