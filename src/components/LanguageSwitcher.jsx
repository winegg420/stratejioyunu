import { useLanguage } from '../context/LanguageContext';

const OPTIONS = [
  { id: 'tr', label: 'Türkçe', code: 'TR' },
  { id: 'en', label: 'English', code: 'EN' },
];

/** Dil seçici — üst bar: TR / EN metin; giriş: aynı metin stili */
export default function LanguageSwitcher({ className = '', compact = false }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={[
        'lang-switcher',
        compact && 'lang-switcher--compact',
        compact && 'lang-switcher--text',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="group"
      aria-label="Dil / Language"
    >
      {!compact && <span className="lang-switcher__title">DİL</span>}
      <div className="lang-switcher__codes">
        {OPTIONS.map((opt, index) => (
          <span key={opt.id} className="lang-switcher__code-wrap">
            {index > 0 && <span className="lang-switcher__sep" aria-hidden="true">/</span>}
            <button
              type="button"
              className={[
                'lang-switcher__code-btn',
                lang === opt.id && 'lang-switcher__code-btn--active',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setLang(opt.id)}
              title={opt.label}
              aria-label={opt.label}
              aria-pressed={lang === opt.id}
            >
              {opt.code}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
