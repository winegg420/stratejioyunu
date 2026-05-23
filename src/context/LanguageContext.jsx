import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  LANG_STORAGE_KEY,
  localizedBuildingLabel,
  localizedResearchDesc,
  localizedResearchName,
  localizedUnitName,
  resourceLabel,
  translate,
} from '../i18n';

export const LanguageContext = createContext(null);

function readStoredLang() {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    return v === 'en' ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);

  const setLang = useCallback((next) => {
    const value = next === 'en' ? 'en' : 'tr';
    setLangState(value);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'tr';
  }, [lang]);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const resLabel = useCallback((id) => resourceLabel(lang, id), [lang]);

  const buildingLabel = useCallback(
    (id, fallback) => localizedBuildingLabel(lang, id, fallback),
    [lang],
  );
  const researchName = useCallback(
    (id, fallback) => localizedResearchName(lang, id, fallback),
    [lang],
  );
  const researchDesc = useCallback(
    (id, fallback) => localizedResearchDesc(lang, id, fallback),
    [lang],
  );
  const unitName = useCallback(
    (id, fallback) => localizedUnitName(lang, id, fallback),
    [lang],
  );

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    resourceLabel: resLabel,
    buildingLabel,
    researchName,
    researchDesc,
    unitName,
    isEn: lang === 'en',
  }), [lang, setLang, t, resLabel, buildingLabel, researchName, researchDesc, unitName]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}

export function usePageT(pageKey) {
  const { t } = useLanguage();
  return useMemo(() => ({
    title: t(`pages.${pageKey}.title`),
    subtitle: t(`pages.${pageKey}.subtitle`),
    status: t(`pages.${pageKey}.status`),
    feed: t(`pages.${pageKey}.feed`),
  }), [t, pageKey]);
}
