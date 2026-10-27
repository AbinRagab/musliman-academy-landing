import { KeyboardEvent, MouseEvent as ReactMouseEvent, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe2 } from 'lucide-react';
import { loadLanguageResource, supportedLanguages, type SupportedLanguage, updateDocumentLanguage } from '../../i18n';

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
  // When provided, languages are rendered as links to the equivalent
  // localized page instead of switching the language in place.
  getLanguageHref?: (language: SupportedLanguage) => string;
};

// Carries booking context (query) and the current section (hash) across.
function navigateWithContext(event: ReactMouseEvent<HTMLAnchorElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  event.preventDefault();
  window.location.assign(`${event.currentTarget.getAttribute('href')}${window.location.search}${window.location.hash}`);
}

export default function LanguageSwitcher({ className = '', getLanguageHref }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
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
    if (event.key === 'Escape' && isOpen) {
      // Close only this list, not a menu panel that contains the switcher.
      event.stopPropagation();
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
        aria-haspopup={getLanguageHref ? undefined : 'listbox'}
        aria-expanded={isOpen}
        aria-controls={getLanguageHref ? menuId : undefined}
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

      {getLanguageHref ? (
        // Kept in the document while closed so the language links stay crawlable.
        <div className="language-switcher__menu" id={menuId} hidden={!isOpen}>
          {languages.map((language) => (
            <a
              key={language.code}
              className={`language-switcher__option ${currentLanguage === language.code ? 'is-active' : ''}`}
              href={getLanguageHref(language.code)}
              hrefLang={language.code}
              lang={language.code}
              aria-current={currentLanguage === language.code ? 'page' : undefined}
              title={language.label}
              onClick={navigateWithContext}
            >
              {language.shortCode}
            </a>
          ))}
        </div>
      ) : isOpen && (
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
