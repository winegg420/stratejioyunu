import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';
import { TurkeyFlagIcon, UkFlagIcon } from './FlagIcons';

const OPTIONS = [
  { id: 'tr', label: 'Türkçe', code: 'TR', Flag: TurkeyFlagIcon },
  { id: 'en', label: 'English', code: 'EN', Flag: UkFlagIcon },
];

function LanguageSwitcherUI({ className = '' }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={['lang-switcher', className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Dil / Language"
    >
      <span className="lang-switcher__title">DİL</span>
      {OPTIONS.map((opt) => {
        const Flag = opt.Flag;
        const active = lang === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            className={[
              'lang-switcher__btn',
              active && 'lang-switcher__btn--active',
              `lang-switcher__btn--${opt.id}`,
            ].filter(Boolean).join(' ')}
            onClick={() => setLang(opt.id)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
          >
            <Flag className="lang-switcher__svg" />
            <span className="lang-switcher__code">{opt.code}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Bayraklar her zaman document.body üzerinde — harita/overlay altında kalmaz.
 */
export default function LanguageSwitcher({ className = '', inline = false }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (inline) {
    return <LanguageSwitcherUI className={className} />;
  }

  return createPortal(
    <LanguageSwitcherUI className={['lang-switcher--portal', className].filter(Boolean).join(' ')} />,
    document.body,
  );
}
