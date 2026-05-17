export default function NavBadge({ show }) {
  if (!show) return null;
  return <span className="nav-alert-badge" aria-label="Yeni bildirim" />;
}
