import Ajv from 'ajv';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export class SchemaValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false
    });
  }

  validate(data: any, schema: any): ValidationResult {
    try {
      const validate = this.ajv.compile(schema);
      const valid = validate(data);

      if (valid) {
        return { valid: true };
      } else {
        const errors = validate.errors?.map(error => {
          const field = error.instancePath || error.params?.missingProperty || 'root';
          return `${field}: ${error.message}`;
        }) || ['Unknown validation error'];

        return {
          valid: false,
          errors
        };
      }
    } catch (error) {
      return {
        valid: false,
        errors: [`Schema compilation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  validateSchema(schema: any): ValidationResult {
    try {
      this.ajv.compile(schema);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [`Invalid schema: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

export default SchemaValidator;
