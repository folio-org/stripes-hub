const DEFAULT_LOCALE = 'en-US';

export const messages = {};

// Promise that resolves when translations are loaded
let translationsLoadedPromise = null;

// Conditionally load translations based on environment
if (typeof globalThis.window !== 'undefined') {
  // In browser/Vite environment, load translations asynchronously
  translationsLoadedPromise = (async () => {
    try {
      const viteModule = await import('./loadTranslations.vite.js');
      Object.assign(messages, viteModule.messages);
    } catch (e) {
      console.warn('Failed to load translations from vite module:', e);
    }
  })();
}
// In Node.js/Jest environment, translations will be injected by tests

/**
 * Loads translations for the specified locale.
 * If the translations for the specified locale are not found, it falls back to the default locale.
 * @param {*} locale the locale to load translations for.
 * @returns translations for the specified locale or default locale if not found.
 */
export const loadTranslations = async (locale) => {
  // Wait for translations to be loaded if in browser environment
  if (translationsLoadedPromise) {
    await translationsLoadedPromise;
  }

  let translations = messages[locale] || messages[DEFAULT_LOCALE] || {};

  return Object.keys(translations).reduce((acc, key) => {
    acc[`stripes-hub.${key}`] = translations[key];
    return acc;
  }, {});
};