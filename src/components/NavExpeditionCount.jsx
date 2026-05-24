export default function NavExpeditionCount({ count, title }) {
  if (!count || count <= 0) return null;
  const label = title ?? `${count} active operations`;
  return (
    <span
      className="nav-expedition-count"
      aria-label={label}
      title={label}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}
