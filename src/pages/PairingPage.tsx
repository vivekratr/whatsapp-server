import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi, setToken } from '../api/client';
import { useAuth } from '../hooks/useAuth';

interface PairingState {
  sessionId: string;
  pairingCode?: string;
  phoneNumber: string;
}

function formatCode(code: string): string {
  const clean = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}`;
}

export function PairingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const state = location.state as PairingState | null;

  const [sessionId] = useState(state?.sessionId ?? '');
  const [pairingCode, setPairingCode] = useState(state?.pairingCode ?? '');
  const [status, setStatus] = useState<string>('initializing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      navigate('/login', { replace: true });
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const result = await authApi.status(sessionId);
        if (cancelled) return;

        setStatus(result.status);
        if (result.pairingCode) {
          setPairingCode(prev => {
            const len = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '').length;
            return len(result.pairingCode!) >= len(prev) ? result.pairingCode! : prev;
          });
        }

        if (result.status === 'ready') {
          const completed = await authApi.complete(sessionId);
          setToken(completed.token);
          const me = await authApi.me();
          login(completed.token, me);
          navigate('/app', { replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to check status');
        }
      }
    };

    void poll();
    const interval = setInterval(poll, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, login, navigate]);

  if (!sessionId) return null;

  return (
    <div className="page pairing-page">
      <header>
        <h1 className="page-title">Link WhatsApp</h1>
        <p className="pairing-subtitle">Enter this code in WhatsApp</p>
      </header>

      <div className="pairing-code" aria-live="polite">
        {pairingCode ? formatCode(pairingCode) : '····-····'}
      </div>

      <ol className="pairing-steps">
        <li>Open <strong>WhatsApp</strong> on this phone</li>
        <li>Menu → <strong>Linked devices</strong></li>
        <li>Tap <strong>Link a device</strong></li>
        <li>Choose <strong>Link with phone number</strong></li>
        <li>Enter the code above</li>
      </ol>

      <div className="pairing-status">
        {status === 'ready' ? (
          <span className="status-connected">Connected</span>
        ) : status === 'qr_ready' ? (
          <span className="status-waiting" role="alert">
            Server is in QR mode — tap below to retry with a pairing code.
          </span>
        ) : (
          <span className="status-waiting">
            <span className="spinner" aria-hidden="true" />
            Waiting for code…
          </span>
        )}
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}

      <button className="btn-text" onClick={() => navigate('/login')}>
        {status === 'qr_ready' ? 'Retry with pairing code' : 'Use a different number'}
      </button>
    </div>
  );
}
