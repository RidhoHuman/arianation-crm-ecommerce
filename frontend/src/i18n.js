import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationID from './locales/id/translation.json';
import translationEN from './locales/en/translation.json';

// Get the initial language from local storage if available
const getInitialLanguage = () => {
  try {
    const storage = localStorage.getItem('arianation-ui-storage');
    if (storage) {
      const parsed = JSON.parse(storage);
      return parsed.state?.language === 'EN' ? 'EN' : 'ID';
    }
  } catch (e) {
    console.error('Failed to parse uiStore from localStorage', e);
  }
  return 'ID';
};

const resources = {
  ID: {
    translation: translationID
  },
  EN: {
    translation: translationEN
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: getInitialLanguage(), // language to use
    fallbackLng: 'ID',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
