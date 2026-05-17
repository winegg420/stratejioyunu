export default function NavExpeditionCount({ count }) {
  if (!count || count <= 0) return null;
  return (
    <span className="nav-expedition-count" aria-label={`${count} aktif sefer`}>
      {count > 9 ? '9+' : count}
    </span>
  );
}
