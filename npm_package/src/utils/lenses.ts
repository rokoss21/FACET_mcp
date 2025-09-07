import { FACETLens } from '../types';

export class FACETLenses {
  private static lenses: Map<string, FACETLens> = new Map();

  static {
    this.registerLens({
      name: 'trim',
      description: 'Remove whitespace from both ends of string',
      apply: (input: string) => input.trim()
    });

    this.registerLens({
      name: 'dedent',
      description: 'Remove common leading whitespace from each line',
      apply: (input: string) => this.dedent(input)
    });

    this.registerLens({
      name: 'squeeze_spaces',
      description: 'Replace multiple consecutive spaces with single space',
      apply: (input: string) => input.replace(/ +/g, ' ')
    });

    this.registerLens({
      name: 'normalize_newlines',
      description: 'Normalize different newline characters to \\n',
      apply: (input: string) => input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    });

    this.registerLens({
      name: 'uppercase',
      description: 'Convert string to uppercase',
      apply: (input: string) => input.toUpperCase()
    });

    this.registerLens({
      name: 'lowercase',
      description: 'Convert string to lowercase',
      apply: (input: string) => input.toLowerCase()
    });

    this.registerLens({
      name: 'limit',
      description: 'Limit string length (usage: limit(100))',
      apply: (input: string) => {
        // This lens expects the limit parameter to be passed differently
        // For now, return input unchanged - this would need proper parameter handling
        return input;
      }
    });
  }

  static registerLens(lens: FACETLens): void {
    this.lenses.set(lens.name, lens);
  }

  static getLens(name: string): FACETLens | undefined {
    return this.lenses.get(name);
  }

  static getAllLenses(): FACETLens[] {
    return Array.from(this.lenses.values());
  }

  static applyLenses(input: string, lensNames: string[]): string {
    let result = input;
    for (const lensName of lensNames) {
      const lens = this.getLens(lensName);
      if (lens) {
        result = lens.apply(result);
      }
    }
    return result;
  }

  private static dedent(text: string): string {
    const lines = text.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);

    if (nonEmptyLines.length === 0) return text;

    // Find the minimum indentation
    const minIndent = Math.min(
      ...nonEmptyLines.map(line => {
        const match = line.match(/^(\s*)/);
        return match ? match[1].length : 0;
      })
    );

    // Remove the common indentation
    return lines
      .map(line => line.length >= minIndent ? line.substring(minIndent) : line)
      .join('\n');
  }
}

export default FACETLenses;
