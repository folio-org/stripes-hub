import { loadTranslations } from './loadTranslations';

describe('loadTranslations', () => {

  it('should prefix all keys with "stripes-hub."', () => {
    const result = loadTranslations('en-US');
    Object.keys(result).forEach(key => {
      expect(key).toMatch(/^stripes-hub\./);
    });
  });

  it('should fallback to default locale when locale is not found', () => {
    const result = loadTranslations('unknown-locale');
    const defaultResult = loadTranslations('en-US');
    expect(result).toEqual(defaultResult);
  });

  it('should return empty object when locale and default locale have no translations', () => {
    const result = loadTranslations('unknown-locale');
    expect(typeof result).toBe('object');
  });

  it('should handle null or undefined locale gracefully', () => {
    const resultNull = loadTranslations(null);
    const resultUndefined = loadTranslations(undefined);
    expect(resultNull).toEqual(expect.any(Object));
    expect(resultUndefined).toEqual(expect.any(Object));
  });
});