const DEFAULT_LOCALE = 'en-US';

export const messages = {};

const translationsLoadedPromise = typeof globalThis.window !== 'undefined' //NOSONOR
  ? import('./loadTranslations.vite.js')
    .then((viteModule) => {
      Object.assign(messages, viteModule.messages);
    })
    .catch((e) => {
      console.warn('Failed to load translations from vite module:', e);
    })
  : Promise.resolve();
// In Node.js/Jest environment, translations will be injected by tests

/**
 * Loads translations for the specified locale.
 * If the translations for the specified locale are not found, it falls back to the default locale.
 * @param {*} locale the locale to load translations for.
 * @returns translations for the specified locale or default locale if not found.
 */
export const loadTranslations = async (locale) => {
  await translationsLoadedPromise;

  let translations = messages[locale] || messages[DEFAULT_LOCALE] || {};

  return Object.keys(translations).reduce((acc, key) => {
    acc[`stripes-hub.${key}`] = translations[key];
    return acc;
  }, {});
};
