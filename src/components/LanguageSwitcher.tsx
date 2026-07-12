import { useTranslation } from 'react-i18next';
import Icon from './Icon';
import { supportedLanguages, type SupportedLanguage, updateDocumentLanguage } from '../i18n';

const languageLabels: Record<SupportedLanguage, string> = {
  en: 'EN',
  ar: 'AR',
  es: 'ES',
  de: 'DE',
  it: 'IT',
  ur: 'UR',
  tr: 'TR',
};

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage?.split('-')[0] || i18n.language.split('-')[0] || 'en';

  async function handleLanguageChange(language: string) {
    await i18n.changeLanguage(language);
    window.localStorage.setItem('i18nextLng', language);
    updateDocumentLanguage(language);
  }

  return (
    <label className={`language-switcher ${className}`.trim()}>
      <Icon name="globe" />
      <select
        value={currentLanguage}
        onChange={(event) => handleLanguageChange(event.target.value)}
        aria-label={t('language.label')}
      >
        {supportedLanguages.map((language) => (
          <option value={language} key={language}>
            {languageLabels[language]}
          </option>
        ))}
      </select>
    </label>
  );
}
