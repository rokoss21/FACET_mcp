import FACETLenses from '../utils/lenses';

describe('FACET Lenses', () => {
  test('trim lens removes whitespace from both ends', () => {
    const result = FACETLenses.applyLenses('  hello world  ', ['trim']);
    expect(result).toBe('hello world');
  });

  test('squeeze_spaces lens removes extra spaces', () => {
    const result = FACETLenses.applyLenses('hello   world', ['squeeze_spaces']);
    expect(result).toBe('hello world');
  });

  test('multiple lenses applied in sequence', () => {
    const result = FACETLenses.applyLenses('  hello   world  ', ['trim', 'squeeze_spaces']);
    expect(result).toBe('hello world');
  });

  test('uppercase lens converts to uppercase', () => {
    const result = FACETLenses.applyLenses('hello world', ['uppercase']);
    expect(result).toBe('HELLO WORLD');
  });

  test('lowercase lens converts to lowercase', () => {
    const result = FACETLenses.applyLenses('HELLO WORLD', ['lowercase']);
    expect(result).toBe('hello world');
  });
});
