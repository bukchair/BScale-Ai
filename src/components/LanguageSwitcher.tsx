import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'he', name: 'עברית' },
    { code: 'ru', name: 'Русский' },
    { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' },
  ];

  return (
    <div className="relative group">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white px-3 py-2 rounded-md transition-colors bg-white/5 backdrop-blur-sm border border-gray-200/20 dark:border-white/10"
      >
        <Globe className="w-5 h-5" />
        <span className="uppercase text-sm font-medium">{language}</span>
      </button>
      <div className={`absolute top-full end-0 mt-1 w-32 bg-white dark:bg-[#111] rounded-md shadow-lg border border-gray-100 dark:border-white/10 transition-all z-50 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => {
              setLanguage(lang.code);
              setIsOpen(false);
            }}
            className={`block w-full text-start px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 ${
              language === lang.code ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>
    </div>
  );
}
