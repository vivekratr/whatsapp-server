interface BottomNavProps {
  active: 'schedule' | 'messages';
  onChange: (tab: 'schedule' | 'messages') => void;
}

function ScheduleIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button
        className={active === 'schedule' ? 'active' : ''}
        onClick={() => onChange('schedule')}
        aria-current={active === 'schedule' ? 'page' : undefined}
      >
        <ScheduleIcon />
        <span>Schedule</span>
      </button>
      <button
        className={active === 'messages' ? 'active' : ''}
        onClick={() => onChange('messages')}
        aria-current={active === 'messages' ? 'page' : undefined}
      >
        <MessagesIcon />
        <span>Messages</span>
      </button>
    </nav>
  );
}
