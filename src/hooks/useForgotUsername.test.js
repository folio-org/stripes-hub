import {
  isValidEmail,
  isValidEmailOrPhoneNumber,
  isValidPhoneNumber,
} from './useForgotUsername';

describe('isValidEmailOrPhoneNumber', () => {
  describe('accepts valid email addresses and phone numbers', () => {
    it('accepts valid email addresses', () => {
      expect(isValidEmailOrPhoneNumber('test@example.edu')).toBe(true);
    });

    it('accepts values with comments in username', () => {
      expect(isValidEmailOrPhoneNumber('test+comment@example.edu')).toBe(true);
    });

    it('accepts values with numbers only', () => {
      expect(isValidEmailOrPhoneNumber('12')).toBe(true);
    });

    it('accepts values with numbers and dashes', () => {
      expect(isValidEmailOrPhoneNumber('1-2')).toBe(true);
    });

    it('accepts values with numbers and dots', () => {
      expect(isValidEmailOrPhoneNumber('1.2')).toBe(true);
    });
  });

  it('rejects values that are not valid email addresses or phone numbers', () => {
    // validateForgotUsernameForm trims whitespace so we don't test for
    // whitespace rejection here, even though other validators do.
    expect(isValidEmailOrPhoneNumber('not an email address')).toBe(false);
    expect(isValidEmailOrPhoneNumber('not a phone number')).toBe(false);
    expect(isValidEmailOrPhoneNumber('test$example.edu')).toBe(false);
    expect(isValidEmailOrPhoneNumber('test@example')).toBe(false);
    expect(isValidEmailOrPhoneNumber('1.2a')).toBe(false);
    expect(isValidEmailOrPhoneNumber('1.2!')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('test@example.edu')).toBe(true);
  });

  it('accepts values with comments in username', () => {
    expect(isValidEmail('test+comment@example.edu')).toBe(true);
  });

  it('rejects values without @', () => {
    expect(isValidEmail('test$example.edu')).toBe(false);
  });

  it('rejects values without domain suffix', () => {
    expect(isValidEmail('test@example')).toBe(false);
  });

  it('rejects values with whitespace', () => {
    expect(isValidEmail(' test@example.com ')).toBe(false);
  });
});

describe('isValidPhoneNumber', () => {
  it('accepts values with numbers only', () => {
    expect(isValidPhoneNumber('12')).toBe(true);
  });

  it('accepts values with numbers and dashes', () => {
    expect(isValidPhoneNumber('1-2')).toBe(true);
  });

  it('accepts values with numbers and dots', () => {
    expect(isValidPhoneNumber('1.2')).toBe(true);
  });

  it('rejects values containing characters other than numbers, dashes, and dots', () => {
    expect(isValidPhoneNumber('1.2 ')).toBe(false);
    expect(isValidPhoneNumber('1.2a')).toBe(false);
    expect(isValidPhoneNumber('1.2!')).toBe(false);
  });
});


