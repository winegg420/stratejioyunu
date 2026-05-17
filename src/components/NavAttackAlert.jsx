export default function NavAttackAlert({ show }) {
  if (!show) return null;
  return (
    <span className="nav-attack-alert" aria-label="Şehrinize saldırı geliyor">
      !
    </span>
  );
}
