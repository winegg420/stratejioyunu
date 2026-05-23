import { useMemo, useState } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
import { stateMailMessages } from '../data/placeholder';
import { useAuth } from '../context/AuthContext';
import { formatIdeologyLabel } from '../lib/ideologySystem';
import { useGameStore } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';

const ENCRYPTION_OPTIONS = [
  { id: 'standard', label: 'AES-256 · STATE-MAIL' },
  { id: 'alliance', label: 'QUANTUM-SHIELD · ALLIANCE-CHAN' },
  { id: 'war', label: 'BURN-AFTER-READ · RED-CHANNEL' },
];

export default function Messages() {
  const { playerName } = useAuth();
  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const addToast = useNotificationStore((s) => s.addToast);

  const [selectedId, setSelectedId] = useState(stateMailMessages[0]?.id ?? null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [toPresident, setToPresident] = useState('');
  const [subject, setSubject] = useState('');
  const [encryption, setEncryption] = useState('standard');
  const [body, setBody] = useState('');

  const selected = useMemo(
    () => stateMailMessages.find((m) => m.id === selectedId) ?? null,
    [selectedId],
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!toPresident.trim() || !subject.trim() || !body.trim()) {
      addToast('Tüm resmi alanlar doldurulmalıdır.', 'warn');
      return;
    }
    addToast('Resmi yazışma şifreli kanala iletildi (simülasyon).', 'info');
    setComposeOpen(false);
    setToPresident('');
    setSubject('');
    setBody('');
    setEncryption('standard');
  };

  return (
    <div className="page page--console state-mail-page">
      <LocalizedPageHeader
        pageKey="messages"
        status={playerIdeology ? formatIdeologyLabel(playerIdeology) : '[ OTORİTE BEKLENİYOR ]'}
      />

      <div className="state-mail-toolbar panel">
        <span className="state-mail-toolbar__identity">
          [ GÖNDEREN / PRESIDENT ] <strong>{playerName}</strong>
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setComposeOpen((v) => !v)}
        >
          {composeOpen ? 'Gelen Kutusu' : 'Yeni Resmi Yazı'}
        </button>
      </div>

      {stateMailMessages.length === 0 && !composeOpen ? (
        <MilitaryEmptyState
          variant="panel"
          tag="[ STATE MAIL BOŞ ]"
          icon="🔐"
          title="Resmi yazışma kutusu boş"
          hint="Diğer Başkanlardan gelen şifreli diplomatik yazılar burada listelenir."
          actionLabel="Diplomasi"
          actionTo="/diplomasi"
        />
      ) : (
        <div className="state-mail-layout">
          <aside className="state-mail-inbox panel">
            <div className="state-mail-inbox__head">[ GELEN / STATE-MAIL INBOX ]</div>
            <ul className="state-mail-list">
              {stateMailMessages.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={[
                      'state-mail-list__item',
                      m.unread && 'is-unread',
                      selectedId === m.id && 'is-selected',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => {
                      setSelectedId(m.id);
                      setComposeOpen(false);
                    }}
                  >
                    <span className="state-mail-list__from">{m.fromPresident}</span>
                    <span className="state-mail-list__subject">{m.subject}</span>
                    <span className="state-mail-list__meta">
                      {m.time} · {m.encryption}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {composeOpen ? (
            <section className="state-mail-compose panel">
              <div className="state-mail-compose__head">
                <span className="state-mail-compose__tag">[ YENİ RESMİ YAZI / COMPOSE ]</span>
              </div>
              <form className="state-mail-compose__form" onSubmit={handleSend}>
                <label>
                  [ ALICI / PRESIDENT ]
                  <input
                    type="text"
                    value={toPresident}
                    onChange={(e) => setToPresident(e.target.value)}
                    placeholder="President_Alpha"
                    autoComplete="off"
                  />
                </label>
                <label>
                  [ KONU / SUBJECT ]
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="İttifak teklifi — gizli kanal"
                  />
                </label>
                <label>
                  [ GÜVENLİK PROTOKOLÜ / ENCRYPTION ]
                  <select value={encryption} onChange={(e) => setEncryption(e.target.value)}>
                    {ENCRYPTION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  [ METİN / BODY ]
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Resmi diplomatik metin…"
                  />
                </label>
                <button type="submit" className="state-mail-send-btn">
                  [ RESMİ YAZIŞMAYI İMZALA VE GÖNDER ]
                </button>
              </form>
            </section>
          ) : selected ? (
            <article className="state-mail-detail panel">
              <header className="state-mail-detail__head">
                <span className="state-mail-detail__tag">[ RESMİ YAZIŞMA / READ ]</span>
                <div className="state-mail-field">
                  <span className="state-mail-field__label">[ GÖNDEREN / PRESIDENT ]</span>
                  <span className="state-mail-field__value">{selected.fromPresident}</span>
                </div>
                <div className="state-mail-field">
                  <span className="state-mail-field__label">[ KONU / SUBJECT ]</span>
                  <span className="state-mail-field__value">{selected.subject}</span>
                </div>
                <div className="state-mail-field">
                  <span className="state-mail-field__label">[ GÜVENLİK PROTOKOLÜ / ENCRYPTION ]</span>
                  <span className="state-mail-field__value state-mail-field__value--encrypt">
                    {selected.encryption}
                  </span>
                </div>
                <div className="state-mail-field">
                  <span className="state-mail-field__label">[ ZAMAN / TIMESTAMP ]</span>
                  <span className="state-mail-field__value">{selected.time}</span>
                </div>
              </header>
              <div className="state-mail-detail__body">{selected.body}</div>
            </article>
          ) : (
            <MilitaryEmptyState
              variant="inline"
              tag="[ SEÇİM YOK ]"
              icon="📨"
              title="Okumak için sol listeden yazı seçin"
              hint="veya Yeni Resmi Yazı ile liderden lidere mesaj gönderin."
            />
          )}
        </div>
      )}
    </div>
  );
}
