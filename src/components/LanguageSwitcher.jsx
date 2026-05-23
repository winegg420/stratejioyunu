import { useLanguage } from '../context/LanguageContext';

const FLAGS = [
  { id: 'tr', flag: '🇹🇷', label: 'Türkçe' },
  { id: 'en', flag: '🇬🇧', label: 'English' },
];

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={['lang-switcher', className].filter(Boolean).join(' ')}
      role="group"
      aria-label="Dil seçimi"
    >
      {FLAGS.map((f) => (
        <button
          key={f.id}
          type="button"
          className={[
            'lang-switcher__btn',
            lang === f.id && 'lang-switcher__btn--active',
          ].filter(Boolean).join(' ')}
          onClick={() => setLang(f.id)}
          title={f.label}
          aria-label={f.label}
          aria-pressed={lang === f.id}
        >
          <span className="lang-switcher__flag" aria-hidden="true">{f.flag}</span>
        </button>
      ))}
    </div>
  );
}
