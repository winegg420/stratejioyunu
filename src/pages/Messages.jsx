import PageHeader from '../components/PageHeader';
import { messages } from '../data/placeholder';

export default function Messages() {
  return (
    <div className="page">
      <PageHeader title="Mesajlar" subtitle="Oyuncu ve diplomatik mesajlar, ittifak sayfası." />
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
    </div>
  );
}
