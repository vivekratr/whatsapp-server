import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useScheduledMessages } from '../hooks/useScheduledMessages';
import { BottomNav } from '../components/BottomNav';
import { ScheduleForm } from '../components/ScheduleForm';
import { MessageList } from '../components/MessageList';

export function AppPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState<'schedule' | 'messages'>('schedule');
  const [messageFilter, setMessageFilter] = useState<'scheduled' | 'sent'>('scheduled');
  const [reconnecting, setReconnecting] = useState(false);
  const { messages, loading, reload } = useScheduledMessages(user?.sessionId);

  useEffect(() => {
    if (!user || user.sessionStatus === 'ready') return;

    const interval = setInterval(() => {
      void refreshUser();
    }, 5000);

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  if (!user) return null;

  const displayName = user.pushName || user.phone;

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      const result = await authApi.start(user.phone);
      if (result.status === 'ready') {
        await refreshUser();
        return;
      }
      navigate('/pairing', {
        state: {
          sessionId: result.sessionId,
          pairingCode: result.pairingCode,
          phoneNumber: user.phone,
        },
      });
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Bhakti WA Scheduler</h1>
          <p className="user-label">{displayName}</p>
        </div>
        <button className="btn-text" onClick={logout} aria-label="Log out">
          Log out
        </button>
      </header>

      {user.sessionStatus !== 'ready' && (
        <div className="banner" role="status">
          <p>WhatsApp disconnected — messages may not send until you reconnect.</p>
          <button className="btn-text banner-action" onClick={() => void handleReconnect()} disabled={reconnecting}>
            {reconnecting ? 'Reconnecting…' : 'Reconnect WhatsApp'}
          </button>
        </div>
      )}

      <main className="app-main">
        {tab === 'schedule' ? (
          <ScheduleForm sessionId={user.sessionId} onScheduled={() => reload()} />
        ) : (
          <>
            <div className="segmented-control" role="tablist" aria-label="Message filter">
              <button
                role="tab"
                aria-selected={messageFilter === 'scheduled'}
                className={messageFilter === 'scheduled' ? 'active' : ''}
                onClick={() => setMessageFilter('scheduled')}
              >
                Scheduled
              </button>
              <button
                role="tab"
                aria-selected={messageFilter === 'sent'}
                className={messageFilter === 'sent' ? 'active' : ''}
                onClick={() => setMessageFilter('sent')}
              >
                Sent
              </button>
            </div>
            <MessageList
              sessionId={user.sessionId}
              messages={messages}
              filter={messageFilter}
              loading={loading}
              onRefresh={() => reload()}
              onCancel={() => reload()}
            />
          </>
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
