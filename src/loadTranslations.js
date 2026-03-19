import messages_en_us from '../translations/stripes-hub/en_US.json';
import messages_fr_FR from '../translations/stripes-hub/fr_FR.json';

const messages = {
  'en-US': messages_en_us,
  'fr-FR': messages_fr_FR,
};

const DEFAULT_LOCALE = 'en-US';

/**
 * Loads translations for the specified locale.
 * If the translations for the specified locale are not found, it falls back to the default locale.
 * @param {*} locale the locale to load translations for.
 * @returns translations for the specified locale or default locale if not found.
 */
export const loadTranslations = (locale) => {
  let translations = messages[locale] || messages[DEFAULT_LOCALE] || {};

  return Object.keys(translations).reduce((acc, key) => {
    acc[`stripes-hub.${key}`] = translations[key];
    return acc;
  }, {});
};