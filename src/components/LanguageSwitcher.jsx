import { useLanguage } from '../context/LanguageContext';

const OPTIONS = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'English' },
];

function RectFlag({ locale }) {
  if (locale === 'tr') {
    return (
      <svg className="lang-flag-svg" viewBox="0 0 28 18" width="28" height="18" aria-hidden="true">
        <rect width="28" height="18" fill="#e30a17" />
        <circle cx="11.5" cy="9" r="4.2" fill="#fff" />
        <circle cx="12.8" cy="9" r="3.35" fill="#e30a17" />
        <polygon
          points="17.2,9 18.9,9.55 18.15,8.05 18.15,9.95 18.9,8.45"
          fill="#fff"
        />
      </svg>
    );
  }

  return (
    <svg className="lang-flag-svg" viewBox="0 0 28 18" width="28" height="18" aria-hidden="true">
      <rect width="28" height="18" fill="#012169" />
      <path d="M0 0 L28 18 M28 0 L0 18" stroke="#fff" strokeWidth="3.2" />
      <path d="M0 0 L28 18 M28 0 L0 18" stroke="#c8102e" strokeWidth="1.4" />
      <path d="M14 0 V18 M0 9 H28" stroke="#fff" strokeWidth="5.2" />
      <path d="M14 0 V18 M0 9 H28" stroke="#c8102e" strokeWidth="2.8" />
    </svg>
  );
}

/** Dil seçici — dikdörtgen bayraklar */
export default function LanguageSwitcher({ className = '', compact = false }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={[
        'lang-switcher',
        'lang-switcher--flags',
        compact && 'lang-switcher--compact',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Dil / Language"
    >
      <div className="lang-switcher__flags">
        {OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={[
              'lang-switcher__flag-btn',
              lang === opt.id && 'lang-switcher__flag-btn--active',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => setLang(opt.id)}
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={lang === opt.id}
          >
            <RectFlag locale={opt.id} />
          </button>
        ))}
      </div>
    </div>
  );
}
