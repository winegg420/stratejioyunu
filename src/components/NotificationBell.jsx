import { useNotificationStore } from '../stores/notificationStore';

export default function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const clearUnread = useNotificationStore((s) => s.clearUnread);
  const addToast = useNotificationStore((s) => s.addToast);

  const handleClick = () => {
    clearUnread();
    addToast('Bildirim merkezi yakında eklenecek.', 'info');
  };

  return (
    <button
      type="button"
      className="notification-bell"
      onClick={handleClick}
      aria-label={`Bildirimler${unreadCount ? `, ${unreadCount} yeni` : ''}`}
    >
      <span className="bell-icon" aria-hidden="true">
        🔔
      </span>
      {unreadCount > 0 && (
        <span className="bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </button>
  );
}
