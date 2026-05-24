import { createPortal } from 'react-dom';
import { useModalDismiss, stopModalPropagation } from '../hooks/useModalDismiss';
import CustomDropdown from './CustomDropdown';

const ENCRYPTION_OPTIONS = [
  { id: 'standard', label: 'AES-256 · STATE-MAIL' },
  { id: 'alliance', label: 'QUANTUM-SHIELD · ALLIANCE-CHAN' },
  { id: 'war', label: 'BURN-AFTER-READ · RED-CHANNEL' },
];

function StateMailComposeForm({
  toPresident,
  setToPresident,
  subject,
  setSubject,
  encryption,
  setEncryption,
  body,
  setBody,
  onSubmit,
  onClose,
  inline = false,
}) {
  return (
    <>
      <div className="state-mail-compose__head">
        <span id="state-mail-compose-title" className="state-mail-compose__tag">
          [ YENİ RESMİ YAZI / COMPOSE ]
        </span>
        {onClose && (
          <button
            type="button"
            className="hud-modal-close state-mail-compose__close"
            onClick={onClose}
            aria-label={inline ? 'Gelen kutusuna dön' : 'Yazı penceresini kapat'}
          >
            {inline ? '[ GELEN KUTUSU ]' : '[ X ]'}
          </button>
        )}
      </div>
      <form className="state-mail-compose__form" onSubmit={onSubmit}>
        <label>
          [ ALICI / PRESIDENT ]
          <input
            type="text"
            value={toPresident}
            onChange={(e) => setToPresident(e.target.value)}
            placeholder="Hedef Başkan / lider adı"
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
          <CustomDropdown
            value={encryption}
            onChange={setEncryption}
            aria-label="Şifreleme protokolü"
            options={ENCRYPTION_OPTIONS.map((opt) => ({
              value: opt.id,
              label: opt.label,
            }))}
          />
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
    </>
  );
}

export default function StateMailComposeModal({
  open,
  inline = false,
  onClose,
  toPresident,
  setToPresident,
  subject,
  setSubject,
  encryption,
  setEncryption,
  body,
  setBody,
  onSubmit,
}) {
  useModalDismiss(open && !inline, onClose);

  if (!open) return null;

  const form = (
    <StateMailComposeForm
      toPresident={toPresident}
      setToPresident={setToPresident}
      subject={subject}
      setSubject={setSubject}
      encryption={encryption}
      setEncryption={setEncryption}
      body={body}
      setBody={setBody}
      onSubmit={onSubmit}
      onClose={onClose}
      inline={inline}
    />
  );

  if (inline) {
    return (
      <article
        className="state-mail-compose panel state-mail-compose--inline hud-panel-border"
        aria-labelledby="state-mail-compose-title"
      >
        {form}
      </article>
    );
  }

  return createPortal(
    <div className="state-mail-compose-root" role="presentation" onClick={onClose}>
      <button
        type="button"
        className="state-mail-compose-root__backdrop"
        onClick={onClose}
        aria-label="Yazı penceresini kapat"
      />
      <section
        className="state-mail-compose panel state-mail-compose--modal hud-panel-border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="state-mail-compose-title"
        onClick={stopModalPropagation}
      >
        {form}
      </section>
    </div>,
    document.body,
  );
}
