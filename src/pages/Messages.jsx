import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { messages } from '../data/placeholder';

export default function Messages() {
  return (
    <div className="page">
      <PageHeader title="Mesajlar" subtitle="Oyuncu ve diplomatik mesajlar, ittifak sayfası." />
      {messages.length > 0 ? (
        <ul className="message-list">
          {messages.map((m) => (
            <li key={m.id} className={m.unread ? 'unread' : ''}>
              <div className="msg-header">
                <strong>{m.from}</strong>
                <span>{m.time}</span>
              </div>
              <p className="msg-subject">{m.subject}</p>
              <p className="msg-preview">{m.preview}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="✉️"
          title="Mesaj kutunuz boş"
          description="Diğer oyunculardan gelen diplomatik mesajlar ve ittifak duyuruları burada görünür."
          actionLabel="Diplomasi"
          actionTo="/diplomasi"
        />
      )}
    </div>
  );
}
