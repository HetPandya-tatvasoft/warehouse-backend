export class SkuGeneratorUtil {
  private static readonly VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

  /**
   * Generates a candidate product code from product name.
   * Deterministic, uppercase alphanumeric, max 10 chars.
   */
  static generateProductCode(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'PRD';
    }

    // Split words by spaces, hyphens, underscores, slashes
    const words = trimmed
      .split(/[\s\-_/]+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())
      .filter((w) => w.length > 0);

    if (words.length === 0) {
      return this.fallbackCode('PRD', trimmed, 6);
    }

    if (words.length > 1) {
      // E.g., "T-shirt" -> words ["T", "SHIRT"]
      if (words[0].length === 1 && words[1].length >= 2) {
        // "T-shirt" -> "T" + "SH" -> "TSH"
        const secondConsonants = this.extractConsonants(words[1]);
        const sub = secondConsonants.length >= 2 ? secondConsonants.slice(0, 2) : words[1].slice(0, 2);
        return (words[0] + sub).slice(0, 8);
      }

      // First letter of each word
      const initials = words.map((w) => w[0]).join('');
      if (initials.length >= 3) {
        return initials.slice(0, 6);
      }

      // If only 2 initials, expand second word
      return (initials + words[words.length - 1].slice(1, 4 - initials.length + 1)).slice(0, 6);
    }

    // Single word
    const single = words[0];
    if (single.length <= 4) {
      return single;
    }

    // Extract consonants starting from first character
    const consonants = this.extractConsonants(single);
    if (consonants.length >= 3) {
      return consonants.slice(0, 4);
    }

    // Otherwise first 3-4 alphanumeric characters
    return single.slice(0, 4);
  }

  /**
   * Generates a stable value code for an attribute value label.
   * Checks existing value codes in the same attribute config to prevent collisions.
   */
  static generateValueCode(label: string, existingCodesInAttribute: Set<string>): string {
    const trimmed = label.trim();
    const clean = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (!clean) {
      // Non-alphanumeric fallback
      let counter = 1;
      let fallback = `V${counter}`;
      while (existingCodesInAttribute.has(fallback)) {
        counter++;
        fallback = `V${counter}`;
      }
      return fallback;
    }

    // If already short (1-3 chars, like "S", "M", "L", "XL", "XXL", "32")
    let candidate = '';
    if (clean.length <= 3) {
      candidate = clean;
    } else {
      // Standard 2-character abbreviation
      const consonants = this.extractConsonants(clean);
      if (consonants.length >= 2) {
        candidate = consonants.slice(0, 2);
      } else {
        candidate = clean.slice(0, 2);
      }
    }

    if (!existingCodesInAttribute.has(candidate)) {
      return candidate;
    }

    // Collision resolution step 1: try 3rd character
    if (clean.length >= 3) {
      const candidate3 = clean.slice(0, 3);
      if (!existingCodesInAttribute.has(candidate3)) {
        return candidate3;
      }
    }

    // Collision resolution step 2: append numeric suffix
    let suffix = 2;
    while (existingCodesInAttribute.has(`${candidate}${suffix}`)) {
      suffix++;
    }
    return `${candidate}${suffix}`;
  }

  /**
   * Builds the candidate SKU from product code and ordered dynamic value codes.
   */
  static buildSku(productCode: string, dynamicValueCodes: string[]): string {
    if (!dynamicValueCodes || dynamicValueCodes.length === 0) {
      return `SKU-${productCode}`;
    }
    return `SKU-${productCode}-${dynamicValueCodes.join('-')}`;
  }

  private static extractConsonants(word: string): string {
    const upper = word.toUpperCase();
    if (!upper) return '';
    let result = upper[0]; // Keep first letter even if vowel
    for (let i = 1; i < upper.length; i++) {
      const char = upper[i];
      if (!this.VOWELS.has(char) && /[A-Z0-9]/.test(char)) {
        result += char;
      }
    }
    return result;
  }

  private static fallbackCode(prefix: string, raw: string, length: number): string {
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase();
    return `${prefix}${hex}`.slice(0, length);
  }
}
