import { loadTranslations, messages } from './loadTranslations';

// Mock the vite module to prevent it from being loaded in tests
jest.mock('./loadTranslations.vite.js', () => ({
  messages: {},
}), { virtual: true });

describe('loadTranslations', () => {
  // Setup test translations before running tests
  beforeAll(() => {
    // Clear any existing messages
    Object.keys(messages).forEach(key => delete messages[key]);

    // Inject test translations
    messages['en-US'] = {
      'welcome': 'Welcome',
      'goodbye': 'Goodbye',
      'hello': 'Hello',
    };
    messages['fr-FR'] = {
      'welcome': 'Bienvenue',
      'goodbye': 'Au revoir',
      'hello': 'Bonjour',
    };
  });

  it('should prefix all keys with "stripes-hub."', async () => {
    const result = await loadTranslations('en-US');
    Object.keys(result).forEach(key => {
      expect(key).toMatch(/^stripes-hub\./);
    });
    expect(result['stripes-hub.welcome']).toBe('Welcome');
    expect(result['stripes-hub.hello']).toBe('Hello');
  });

  it('should load translations for different locales', async () => {
    const enResult = await loadTranslations('en-US');
    const frResult = await loadTranslations('fr-FR');

    expect(enResult['stripes-hub.welcome']).toBe('Welcome');
    expect(frResult['stripes-hub.welcome']).toBe('Bienvenue');
  });

  it('should fallback to default locale when locale is not found', async () => {
    const result = await loadTranslations('unknown-locale');
    const defaultResult = await loadTranslations('en-US');
    expect(result).toEqual(defaultResult);
    expect(result['stripes-hub.welcome']).toBe('Welcome');
  });

  it('should return translations object even for unknown locale', async () => {
    const result = await loadTranslations('unknown-locale');
    expect(typeof result).toBe('object');
    expect(Object.keys(result).length).toBeGreaterThan(0);
  });

  it('should handle null or undefined locale gracefully', async () => {
    const resultNull = await loadTranslations(null);
    const resultUndefined = await loadTranslations(undefined);
    expect(resultNull).toEqual(expect.any(Object));
    expect(resultUndefined).toEqual(expect.any(Object));
    // Should fallback to default locale
    expect(resultNull).toEqual(await loadTranslations('en-US'));
  });

  it('should handle empty locale string gracefully', async () => {
    const result = await loadTranslations('');
    expect(result).toEqual(expect.any(Object));
  });
});