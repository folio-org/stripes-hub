const TRANSLATION_PATH = './translations/stripes-hub';
const DEFAULT_LOCALE = 'en-US';

/**
 * Loads translations for the specified locale.
 * If the translations for the specified locale are not found, it falls back to the default locale.
 * @param {*} locale the locale to load translations for.
 * @returns translations for the specified locale or default locale if not found.
 */
export const loadTranslations = (locale) => (async function () {
  let translations = {};
  
  try {
    translations = await import(/* webpackIgnore: true */ `${TRANSLATION_PATH}/${locale}.json`);
  } catch (e) {
    console.warn(`Could not load translations for locale ${locale}, falling back to default locale ${DEFAULT_LOCALE}.`);

    try {
      translations = await import(/* webpackIgnore: true */ `${TRANSLATION_PATH}/${DEFAULT_LOCALE}.json`);
    } catch (e) {
      console.warn(`Could not load translations for default locale ${DEFAULT_LOCALE}. No translations will be available.`);
    }
  }

  return translations;
}());