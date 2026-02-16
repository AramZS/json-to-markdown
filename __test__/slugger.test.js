const slugger = require('../src/slugger');

describe('slugger', () => {
  // Suppress console.log during tests
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe('basic functionality', () => {
    it('should convert a simple string to lowercase slug', () => {
      const result = slugger('Hello World');
      expect(result).toBe('hello-world');
    });

    it('should handle single word', () => {
      const result = slugger('Hello');
      expect(result).toBe('hello');
    });

    it('should replace spaces with hyphens', () => {
      const result = slugger('My Test String');
      expect(result).toBe('my-test-string');
    });

    it('should handle numbers', () => {
      const result = slugger('Test 123');
      expect(result).toBe('test-123');
    });

    it('should handle alphanumeric strings', () => {
      const result = slugger('Version 2.0.1');
      expect(result).toBe('version-2-0-1');
    });
  });

  describe('special characters handling', () => {
    it('should remove special characters', () => {
      const result = slugger('Hello@World!');
      expect(result).toBe('hello-world');
      const result2 = slugger('Texting & Driving');
      expect(result2).toBe('texting-and-driving');
      const result3 = slugger('Something // Way by Päter');
      expect(result3).toBe('something-way-by-pater');
      const result4 = slugger('Bloody by Rắn Cạp Đuôi');
      expect(result4).toBe('bloody-by-ran-cap-djuoi');
      const result5 = slugger('เจ็บคอ by กระต่าย พรรณนิภา', true); // Can't mix languages
      expect(result5).toBe('ecchbkh-by-krataay-phrrnniphaa');
    });

    it('should handle strings with underscores', () => {
      const result = slugger('hello_world');
      expect(result).toBe('hello-world');
    });

    it('should handle strings with multiple special characters', () => {
      const result = slugger('Test$String%With&Special*Chars');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle parentheses', () => {
      const result = slugger('Hello (World)');
      expect(result).toBe('hello-world');
    });

    it('should handle brackets', () => {
      const result = slugger('Hello [World]');
      expect(result).toBe('hello-world');
    });
  });

  describe('Unicode and transliteration', () => {
    it('should handle accented characters', () => {
      const result = slugger('Café');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle German umlauts', () => {
      const result = slugger('Müller');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Cyrillic characters', () => {
      const result = slugger('Привет');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Chinese characters', () => {
      const result = slugger('你好世界');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Japanese characters', () => {
      const result = slugger('こんにちは');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Arabic characters', () => {
      const result = slugger('مرحبا');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle emojis', () => {
      const result = slugger('Hello 😀 World');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toBe('hello-world');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = slugger('');
      expect(typeof result).toBe('string');
    });

    it('should handle strings with only spaces', () => {
      const result = slugger('   ');
      expect(typeof result).toBe('string');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const result = slugger(longString);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle strings with only special characters', () => {
      const result = slugger('!@#$%^&*()');
      expect(typeof result).toBe('string');
    });

    it('should handle strings with mixed case', () => {
      const result = slugger('HeLLo WoRLd');
      expect(result).toBe('hello-world');
    });

    it('should handle strings with multiple consecutive spaces', () => {
      const result = slugger('Hello    World');
      expect(result).toBe('hello-world');
    });

    it('should handle strings with leading/trailing spaces', () => {
      const result = slugger('  Hello World  ');
      expect(result).toBe('hello-world');
    });
  });

  describe('URL safety', () => {
    it('should produce URL-safe output for standard ASCII', () => {
      const result = slugger('Test URL Safe String');
      expect(result).toMatch(/^[a-z0-9-]+$/);
    });

    it('should handle forward slashes', () => {
      const result = slugger('path/to/file');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toBe('path-to-file');
    });

    it('should handle backslashes', () => {
      const result = slugger('path\\to\\file');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toBe('path-to-file');
    });

    it('should handle URL-like strings', () => {
      const result = slugger('https://example.com/path');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('consistency', () => {
    it('should produce same output for same input', () => {
      const input = 'Test String 123';
      const result1 = slugger(input);
      const result2 = slugger(input);
      expect(result1).toBe(result2);
    });

    it('should be deterministic with special characters', () => {
      const input = 'Special!@#Characters';
      const result1 = slugger(input);
      const result2 = slugger(input);
      expect(result1).toBe(result2);
    });

    it('should be deterministic with Unicode characters', () => {
      const input = 'Привет Мир';
      const result1 = slugger(input);
      const result2 = slugger(input);
      expect(result1).toBe(result2);
    });
  });

  describe('return type', () => {
    it('should always return a string', () => {
      expect(typeof slugger('test')).toBe('string');
      expect(typeof slugger('')).toBe('string');
      expect(typeof slugger('!@#$')).toBe('string');
    });
  });
});
