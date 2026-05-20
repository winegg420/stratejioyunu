export default function NewsFeed({ items }) {
  return (
    <div className="news-feed">
      <h3 className="panel-title">Canlı Haber Akışı</h3>
      <ul className="news-list">
        {items.map((item, i) => (
          <li key={item.id ?? i} className={`news-item news-${item.type}`}>
            <span className="news-time">{item.time}</span>
            <span className="news-text">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
