const DEFAULT_LOCALE = 'en-US';

export const messages = {};

/**
 * Returns a promise that resolves to the loaded translations.
 * @returns {Promise<Object>} A promise resolving to the loaded translations.
 */
const translationsLoadedPromise = () => {
  return new Promise((resolve) => {
    const messages = {};

    // Dynamically import all translation JSON files from the translations folder
    const translationModules = import.meta.glob('../translations/stripes-hub/*.json', { eager: true });

    Object.entries(translationModules).forEach(([path, module]) => {
      // Extract filename from path (e.g., '../translations/stripes-hub/en_US.json' -> 'en_US')
      const filename = path.split('/').pop().replaceAll('.json', '');
      // Convert filename to locale format (e.g., 'en_US' -> 'en-US')
      const locale = filename.replaceAll(/_/g, '-');
      messages[locale] = module.default;
    });
    resolve(messages);
  });
};

/**
 * Loads translations for the specified locale.
 * If the translations for the specified locale are not found, it falls back to the default locale.
 * @param {string} locale the locale to load translations for.
 * @returns {Promise<Object>} A promise resolving to the translations for the specified locale or default locale if not found.
 */
export const loadTranslations = async (locale) => {
  const messages = await translationsLoadedPromise();

  const translations = messages[locale] || messages[DEFAULT_LOCALE] || {};

  return Object.keys(translations).reduce((acc, key) => {
    acc[`stripes-hub.${key}`] = translations[key];
    return acc;
  }, {});
};
