import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe2 } from 'lucide-react';
import { loadLanguageResource, supportedLanguages, type SupportedLanguage, updateDocumentLanguage } from '../i18n';

const languages: Array<{ code: SupportedLanguage; shortCode: string; label: string }> = [
  { code: 'en', shortCode: 'EN', label: 'English' },
  { code: 'ar', shortCode: 'AR', label: 'Arabic' },
  { code: 'es', shortCode: 'ES', label: 'Spanish' },
  { code: 'de', shortCode: 'DE', label: 'German' },
  { code: 'it', shortCode: 'IT', label: 'Italian' },
  { code: 'ur', shortCode: 'UR', label: 'Urdu' },
  { code: 'tr', shortCode: 'TR', label: 'Turkish' },
];

const languageLabels = languages.reduce(
  (labels, language) => ({ ...labels, [language.code]: language.shortCode }),
  {} as Record<SupportedLanguage, string>,
);

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const resolvedLanguage = i18n.resolvedLanguage?.split('-')[0] || i18n.language.split('-')[0] || 'en';
  const currentLanguage = supportedLanguages.includes(resolvedLanguage as SupportedLanguage)
    ? resolvedLanguage as SupportedLanguage
    : 'en';

  async function handleLanguageChange(language: string) {
    await loadLanguageResource(language);
    await i18n.changeLanguage(language);
    window.localStorage.setItem('i18nextLng', language);
    updateDocumentLanguage(language);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!switcherRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div
      className={`language-switcher ${isOpen ? 'is-open' : ''} ${className}`.trim()}
      ref={switcherRef}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="language-switcher__trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('language.label')}
      >
        <span className="language-switcher__icon" aria-hidden="true">
          <Globe2 />
        </span>
        <span className="language-switcher__value">{languageLabels[currentLanguage]}</span>
        <span className="language-switcher__arrow" aria-hidden="true">
          <ChevronDown />
        </span>
      </button>

      {isOpen && (
        <div className="language-switcher__menu" role="listbox" aria-label={t('language.label')}>
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              className={`language-switcher__option ${currentLanguage === language.code ? 'is-active' : ''}`}
              onClick={() => handleLanguageChange(language.code)}
              role="option"
              aria-selected={currentLanguage === language.code}
              title={language.label}
            >
              {language.shortCode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
