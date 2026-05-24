import { useEffect, useMemo, useState } from 'react';
import LocalizedPageHeader from '../components/LocalizedPageHeader';
import MilitaryEmptyState from '../components/MilitaryEmptyState';
import StateMailComposeModal from '../components/StateMailComposeModal';
import { stateMailMessages } from '../data/placeholder';
import { useAuth } from '../context/AuthContext';
import { getAuthUser } from '../lib/auth';
import { formatStateMailDate } from '../lib/formatDisplayDate';
import { formatIdeologyLabel } from '../lib/ideologySystem';
import { resolvePlayerDisplayName } from '../lib/profileApi';
import { useLanguage } from '../context/LanguageContext';
import { useGameStore } from '../stores/gameStore';
import { useNotificationStore } from '../stores/notificationStore';

export default function Messages() {
  const { playerName, session } = useAuth();
  const { lang, t } = useLanguage();
  const profileDisplayName = useGameStore((s) => s.profileDisplayName);
  const profilePlayerName = useGameStore((s) => s.profilePlayerName);
  const playerIdeology = useGameStore((s) => s.playerIdeology);
  const addToast = useNotificationStore((s) => s.addToast);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setAuthUser(null);
      return undefined;
    }
    let cancelled = false;
    getAuthUser().then((user) => {
      if (!cancelled) setAuthUser(user);
    });
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  const senderName = useMemo(
    () => resolvePlayerDisplayName({
      user: authUser ?? session?.user,
      profileDisplayName: profileDisplayName || profilePlayerName,
      playerName,
    }),
    [authUser, session?.user, profileDisplayName, profilePlayerName, playerName],
  );

  const mailMessages = stateMailMessages;

  const [selectedId, setSelectedId] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [toPresident, setToPresident] = useState('');
  const [subject, setSubject] = useState('');
  const [encryption, setEncryption] = useState('standard');
  const [body, setBody] = useState('');

  const selected = useMemo(
    () => mailMessages.find((m) => m.id === selectedId) ?? null,
    [mailMessages, selectedId],
  );

  const handleSend = (e) => {
    e.preventDefault();
    if (!toPresident.trim() || !subject.trim() || !body.trim()) {
      addToast(t('pages.messages.sendValidation'), 'warn');
      return;
    }
    const recipient = toPresident.trim();
    const sentMsg = t('pages.messages.sendSuccess', { recipient });
    addToast(
      sentMsg.includes('pages.messages.sendSuccess')
        ? `Resmi yazışma ${recipient} adresine iletildi.`
        : sentMsg,
      'success',
    );
    setComposeOpen(false);
    setToPresident('');
    setSubject('');
    setBody('');
    setEncryption('standard');
  };

  const openCompose = () => {
    setComposeOpen(true);
    setSelectedId(null);
  };

  const closeCompose = () => {
    setComposeOpen(false);
    if (mailMessages.length > 0 && !selectedId) {
      setSelectedId(mailMessages[0].id);
    }
  };

  const showEmptyInbox = mailMessages.length === 0 && !composeOpen;

  return (
    <div className="page page--console state-mail-page">
      <LocalizedPageHeader
        pageKey="messages"
        status={playerIdeology ? formatIdeologyLabel(playerIdeology) : '[ OTORİTE BEKLENİYOR ]'}
        action={(
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => (composeOpen ? closeCompose() : openCompose())}
          >
            {composeOpen ? 'Gelen Kutusu' : 'Yeni Resmi Yazı'}
          </button>
        )}
      />

      <div className="state-mail-toolbar panel">
        <span className="state-mail-toolbar__identity">
          [ GÖNDEREN / PRESIDENT ] <strong>{senderName}</strong>
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => (composeOpen ? closeCompose() : openCompose())}
        >
          {composeOpen ? 'Gelen Kutusu' : 'Yeni Resmi Yazı'}
        </button>
      </div>

      {showEmptyInbox ? (
        <MilitaryEmptyState
          variant="panel"
          tag="[ STATE MAIL BOŞ ]"
          icon="🔐"
          title="Henüz resmi yazışma yok"
          hint="Diğer Başkanlardan gelen şifreli diplomatik yazılar burada listelenir."
          actionLabel="Yeni Resmi Yazı"
          onAction={openCompose}
        />
      ) : (
        <div className="state-mail-layout">
          <aside className="state-mail-inbox panel">
            <div className="state-mail-inbox__head">[ GELEN / STATE-MAIL INBOX ]</div>
            {mailMessages.length === 0 ? (
              <p className="state-mail-inbox__empty hint">Gelen kutusu boş — yeni yazı oluşturun.</p>
            ) : (
              <ul className="state-mail-list">
                {mailMessages.map((m) => (
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
                        {formatStateMailDate(m.time, lang)} · {m.encryption}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {composeOpen ? (
            <StateMailComposeModal
              open
              inline
              onClose={closeCompose}
              toPresident={toPresident}
              setToPresident={setToPresident}
              subject={subject}
              setSubject={setSubject}
              encryption={encryption}
              setEncryption={setEncryption}
              body={body}
              setBody={setBody}
              onSubmit={handleSend}
            />
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
                  <span className="state-mail-field__value">{formatStateMailDate(selected.time, lang)}</span>
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
              actionLabel="Yeni Resmi Yazı"
              onAction={openCompose}
            />
          )}
        </div>
      )}
    </div>
  );
}
