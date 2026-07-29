const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const TOKEN_KEY = 'wa_token';

export type SessionStatus =
  | 'created'
  | 'initializing'
  | 'connecting'
  | 'qr_ready'
  | 'pairing_ready'
  | 'authenticating'
  | 'ready'
  | 'disconnected'
  | 'failed';

export type ScheduledMessageStatus =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AuthUser {
  phone: string;
  sessionId: string;
  role: string;
  sessionStatus: SessionStatus;
  pushName?: string;
}

export interface SavedContact {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface ScheduledMessage {
  id: string;
  sessionId: string;
  scheduledAt: string;
  status: ScheduledMessageStatus;
  messageType: string;
  recipientCount: number;
  recipients?: string[];
  content?: { text?: string; caption?: string };
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const authApi = {
  start: (phoneNumber: string) =>
    request<{ sessionId: string; pairingCode?: string; status: SessionStatus }>('/mobile/auth/start', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  status: (sessionId: string) =>
    request<{ status: SessionStatus; pairingCode?: string; phone?: string }>(`/mobile/auth/status/${sessionId}`),

  complete: (sessionId: string) =>
    request<{ token: string; expiresAt: string; sessionId: string; phone: string }>(
      `/mobile/auth/complete/${sessionId}`,
      { method: 'POST' },
    ),

  me: () => request<AuthUser>('/mobile/auth/me'),

  logout: () => request<{ success: boolean }>('/mobile/auth/logout', { method: 'POST' }),
};

export const scheduledApi = {
  list: (sessionId: string, params?: { status?: ScheduledMessageStatus; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<{ data: ScheduledMessage[]; total: number }>(
      `/sessions/${sessionId}/scheduled-messages${qs ? `?${qs}` : ''}`,
    );
  },

  create: (
    sessionId: string,
    data: {
      scheduledAt: string;
      recipients: string[];
      messageType: 'text';
      content: { text: string };
    },
  ) =>
    request<ScheduledMessage>(`/sessions/${sessionId}/scheduled-messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  cancel: (sessionId: string, id: string) =>
    request<{ id: string; status: ScheduledMessageStatus }>(`/sessions/${sessionId}/scheduled-messages/${id}`, {
      method: 'DELETE',
    }),
};

export const savedContactsApi = {
  list: (sessionId: string, q?: string) => {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    return request<{ data: SavedContact[] }>(`/sessions/${sessionId}/saved-contacts${query}`);
  },

  upsert: (sessionId: string, data: { contacts: { phone: string; name?: string }[] }) =>
    request<{ data: SavedContact[] }>(`/sessions/${sessionId}/saved-contacts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  remove: (sessionId: string, id: string) =>
    request<void>(`/sessions/${sessionId}/saved-contacts/${id}`, { method: 'DELETE' }),
};
