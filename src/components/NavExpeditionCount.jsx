export default function NavExpeditionCount({ count, title }) {
  if (!count || count <= 0) return null;
  return (
    <span
      className="nav-expedition-count"
      aria-label={`${count} aktif sefer`}
      title={title}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
