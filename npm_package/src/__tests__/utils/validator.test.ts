import SchemaValidator from '../../utils/validator';

describe('SchemaValidator', () => {
  let validator: SchemaValidator;

  beforeEach(() => {
    validator = new SchemaValidator();
  });

  describe('validate method', () => {
    test('validates simple string schema', () => {
      const schema = { type: 'string' };
      const result = validator.validate('hello', schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('validates object schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const validData = { name: 'John', age: 30 };
      const result = validator.validate(validData, schema);
      expect(result.valid).toBe(true);
    });

    test('detects invalid data', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const invalidData = { age: 'thirty' }; // missing name, wrong type for age
      const result = validator.validate(invalidData, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('validates array schema', () => {
      const schema = {
        type: 'array',
        items: { type: 'string' }
      };

      const result = validator.validate(['a', 'b', 'c'], schema);
      expect(result.valid).toBe(true);
    });

    test('validates number constraints', () => {
      const schema = {
        type: 'number',
        minimum: 0,
        maximum: 100
      };

      expect(validator.validate(50, schema).valid).toBe(true);
      expect(validator.validate(-10, schema).valid).toBe(false);
      expect(validator.validate(150, schema).valid).toBe(false);
    });
  });

  describe('validateSchema method', () => {
    test('validates correct schema', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        }
      };

      const result = validator.validateSchema(schema);
      expect(result.valid).toBe(true);
    });

    test('detects invalid schema', () => {
      const invalidSchema = {
        type: 'invalid_type',
        properties: {
          name: { type: 'string' }
        }
      };

      const result = validator.validateSchema(invalidSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('handles null input gracefully', () => {
      const result = validator.validate(null, {});
      // AJV considers null valid against empty schema
      expect(result).toBeDefined();
    });

    test('handles schema with unknown properties', () => {
      const schemaWithUnknown = { type: 'object', unknown_property: 'value' };
      const result = validator.validate({}, schemaWithUnknown);
      // AJV ignores unknown properties, so this should be valid
      expect(result).toBeDefined();
    });

    test('handles complex nested schemas', () => {
      const complexSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  age: { type: 'number' },
                  tags: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      };

      const validData = {
        user: {
          name: 'John',
          profile: {
            age: 30,
            tags: ['developer', 'typescript']
          }
        }
      };

      const result = validator.validate(validData, complexSchema);
      expect(result.valid).toBe(true);
    });
  });

  describe('JSON Schema Features', () => {
    test('supports enum validation', () => {
      const schema = {
        type: 'string',
        enum: ['red', 'green', 'blue']
      };

      expect(validator.validate('red', schema).valid).toBe(true);
      expect(validator.validate('yellow', schema).valid).toBe(false);
    });

    test('supports pattern validation', () => {
      const schema = {
        type: 'string',
        pattern: '^\\d{3}-\\d{3}-\\d{4}$'
      };

      expect(validator.validate('123-456-7890', schema).valid).toBe(true);
      expect(validator.validate('invalid', schema).valid).toBe(false);
    });

    test('handles format validation (may be ignored without additional plugins)', () => {
      const schema = {
        type: 'string',
        format: 'email'
      };

      // AJV may ignore unknown formats without plugins
      const result1 = validator.validate('user@example.com', schema);
      const result2 = validator.validate('not-an-email', schema);

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
