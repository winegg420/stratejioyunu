import { useNotificationStore } from '../stores/notificationStore';

const TYPE_ICONS = {
  info: 'ℹ️',
  success: '✅',
  warn: '⚠️',
  intel: '🕵️',
  danger: '🚨',
};

export default function ToastContainer() {
  const toasts = useNotificationStore((s) => s.toasts);

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{TYPE_ICONS[t.type] || 'ℹ️'}</span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
