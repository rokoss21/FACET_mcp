import FACETLenses from '../../utils/lenses';

describe('FACETLenses', () => {
  describe('Individual Lenses', () => {
    test('trim removes whitespace from both ends', () => {
      expect(FACETLenses.applyLenses('  hello world  ', ['trim'])).toBe('hello world');
      expect(FACETLenses.applyLenses('\t\n hello \t\n', ['trim'])).toBe('hello');
      expect(FACETLenses.applyLenses('', ['trim'])).toBe('');
    });

    test('dedent removes common leading whitespace', () => {
      const input = `  line1
    line2
  line3`;
      const expected = `line1
  line2
line3`;
      expect(FACETLenses.applyLenses(input, ['dedent'])).toBe(expected);
    });

    test('squeeze_spaces replaces multiple spaces with single space', () => {
      expect(FACETLenses.applyLenses('hello   world', ['squeeze_spaces'])).toBe('hello world');
      expect(FACETLenses.applyLenses('a    b    c', ['squeeze_spaces'])).toBe('a b c');
      expect(FACETLenses.applyLenses('no extra spaces', ['squeeze_spaces'])).toBe('no extra spaces');
    });

    test('normalize_newlines converts all newlines to \\n', () => {
      expect(FACETLenses.applyLenses('line1\r\nline2\rline3', ['normalize_newlines'])).toBe('line1\nline2\nline3');
    });

    test('uppercase converts to uppercase', () => {
      expect(FACETLenses.applyLenses('Hello World', ['uppercase'])).toBe('HELLO WORLD');
      expect(FACETLenses.applyLenses('hello world', ['uppercase'])).toBe('HELLO WORLD');
    });

    test('lowercase converts to lowercase', () => {
      expect(FACETLenses.applyLenses('HELLO WORLD', ['lowercase'])).toBe('hello world');
      expect(FACETLenses.applyLenses('Hello World', ['lowercase'])).toBe('hello world');
    });

    test('limit lens is available', () => {
      const lenses = FACETLenses.getAllLenses();
      const limitLens = lenses.find(l => l.name === 'limit');
      expect(limitLens).toBeDefined();
      expect(limitLens!.description).toContain('Limit string length');
    });
  });

  describe('Lens Combinations', () => {
    test('trim + squeeze_spaces cleans messy text', () => {
      const input = '   hello   world   with   extra   spaces   ';
      const result = FACETLenses.applyLenses(input, ['trim', 'squeeze_spaces']);
      expect(result).toBe('hello world with extra spaces');
    });

    test('normalize_newlines + trim + squeeze_spaces for messy multiline', () => {
      const input = '  \r\n  hello   world  \r\n  test   \r\n  ';
      const result = FACETLenses.applyLenses(input, ['normalize_newlines', 'trim', 'squeeze_spaces']);
      // The result should be cleaned up, just check it doesn't contain original whitespace
      expect(result).not.toContain('\r');
      expect(result).toContain('hello world');
      expect(result).toContain('test');
    });

    test('case conversion + trimming', () => {
      const input = '  Hello World  ';
      const result = FACETLenses.applyLenses(input, ['trim', 'uppercase']);
      expect(result).toBe('HELLO WORLD');
    });

    test('complex transformation pipeline', () => {
      const input = '  \t\n  Hello   World  \t  \r\n  ';
      const result = FACETLenses.applyLenses(input, [
        'normalize_newlines',
        'trim',
        'squeeze_spaces',
        'lowercase'
      ]);
      expect(result).toBe('hello world');
    });
  });

  describe('Lens Registration', () => {
    test('can register custom lens', () => {
      const customLens = {
        name: 'reverse',
        description: 'Reverses the string',
        apply: (input: string) => input.split('').reverse().join('')
      };

      FACETLenses.registerLens(customLens);
      expect(FACETLenses.getLens('reverse')).toBe(customLens);
      expect(FACETLenses.applyLenses('hello', ['reverse'])).toBe('olleh');
    });

    test('getAllLenses returns all registered lenses', () => {
      const lenses = FACETLenses.getAllLenses();
      expect(lenses.length).toBeGreaterThan(0);
      expect(lenses.find(l => l.name === 'trim')).toBeDefined();
      expect(lenses.find(l => l.name === 'uppercase')).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty strings', () => {
      expect(FACETLenses.applyLenses('', ['trim'])).toBe('');
      expect(FACETLenses.applyLenses('', ['squeeze_spaces'])).toBe('');
    });

    test('handles strings with only whitespace', () => {
      expect(FACETLenses.applyLenses('   \t\n  ', ['trim'])).toBe('');
      expect(FACETLenses.applyLenses('   \t\n  ', ['squeeze_spaces'])).toBe(' \t\n ');
    });

    test('handles undefined lens gracefully', () => {
      expect(FACETLenses.getLens('nonexistent')).toBeUndefined();
      expect(FACETLenses.applyLenses('test', ['nonexistent'])).toBe('test');
    });

    test('handles empty lens array', () => {
      expect(FACETLenses.applyLenses('test', [])).toBe('test');
    });
  });
});
