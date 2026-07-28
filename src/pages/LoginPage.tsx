import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, setToken } from '../api/client';
import { useAuth } from '../hooks/useAuth';

const COUNTRY_CODES = [
  { code: '91', label: '+91' },
  { code: '1', label: '+1' },
  { code: '44', label: '+44' },
  { code: '971', label: '+971' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [countryCode, setCountryCode] = useState('91');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8) {
      setError('Enter a valid phone number');
      return;
    }

    const phoneNumber = `${countryCode}${digits}`;
    setLoading(true);
    setError(null);

    try {
      const result = await authApi.start(phoneNumber);

      if (result.status === 'ready') {
        const completed = await authApi.complete(result.sessionId);
        setToken(completed.token);
        const me = await authApi.me();
        login(completed.token, me);
        navigate('/app', { replace: true });
        return;
      }

      navigate('/pairing', {
        state: {
          sessionId: result.sessionId,
          pairingCode: result.pairingCode,
          phoneNumber,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page login-page">
      <header className="login-header">
        <h1 className="page-title">Bhakti WA Scheduler</h1>
        <p className="page-subtitle">Schedule WhatsApp messages from your phone</p>
      </header>

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-card">
          <div className="form-field">
            <label className="label-text" htmlFor="phone">Your WhatsApp number</label>
            <div className="phone-input-row">
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                aria-label="Country code"
              >
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>
          </div>
        </div>

        {error && <p className="error-text" role="alert">{error}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Connecting…' : 'Continue'}
        </button>
      </form>

      <p className="login-hint">
        Link WhatsApp with a pairing code — no QR scan on this device.
      </p>
    </div>
  );
}
