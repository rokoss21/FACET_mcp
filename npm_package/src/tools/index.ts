import { MCPTool } from '../types';
import FACETLenses from '../utils/lenses';
import SchemaValidator from '../utils/validator';

export class MCPTools {
  private validator: SchemaValidator;

  constructor() {
    this.validator = new SchemaValidator();
  }

  getAllTools(): MCPTool[] {
    return [
      this.createExecuteTool(),
      this.createApplyLensesTool(),
      this.createValidateSchemaTool()
    ];
  }

  private createExecuteTool(): MCPTool {
    return {
      name: 'execute',
      description: 'Execute a complete FACET document with processing and validation. Use for complex multi-step pipelines with input processing and output contracts.',
      parameters: {
        type: 'object',
        properties: {
          facet_source: {
            type: 'string',
            description: 'Complete FACET document text to execute'
          },
          variables: {
            type: 'object',
            description: 'Optional variables for template substitution',
            additionalProperties: true
          }
        },
        required: ['facet_source']
      },
      handler: async (params) => {
        try {
          // Simple FACET execution simulation
          // In a full implementation, this would parse and execute FACET documents
          const { facet_source, variables = {} } = params;

          // Basic template substitution
          let processed = facet_source;
          for (const [key, value] of Object.entries(variables)) {
            processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
          }

          return {
            result: processed,
            executed: true,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          throw new Error(`FACET execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
  }

  private createApplyLensesTool(): MCPTool {
    return {
      name: 'apply_lenses',
      description: 'Apply one or more FACET lenses to input text for reliable text transformations.',
      parameters: {
        type: 'object',
        properties: {
          input_string: {
            type: 'string',
            description: 'Text to process with lenses'
          },
          lenses: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of lenses to apply (e.g., ["dedent", "trim", "limit(100)"])'
          }
        },
        required: ['input_string', 'lenses']
      },
      handler: async (params) => {
        try {
          const { input_string } = params;
          let { lenses } = params;

          if (!Array.isArray(lenses)) {
            lenses = []; // Default to empty array if not provided
          }

          const result = FACETLenses.applyLenses(input_string, lenses);

          return {
            original: input_string,
            result: result,
            lenses_applied: lenses,
            changed: result !== input_string
          };
        } catch (error) {
          throw new Error(`Lens application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
  }

  private createValidateSchemaTool(): MCPTool {
    return {
      name: 'validate_schema',
      description: 'Validate JSON data against a JSON Schema. Ensures data quality and prevents format errors.',
      parameters: {
        type: 'object',
        properties: {
          json_object: {
            type: 'object',
            description: 'JSON object to validate'
          },
          json_schema: {
            type: 'object',
            description: 'JSON Schema to validate against'
          }
        },
        required: ['json_object', 'json_schema']
      },
      handler: async (params) => {
        try {
          const { json_object, json_schema } = params;

          const validation = this.validator.validate(json_object, json_schema);

          return {
            valid: validation.valid,
            errors: validation.errors || null,
            schema_valid: this.validator.validateSchema(json_schema).valid
          };
        } catch (error) {
          throw new Error(`Schema validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
  }
}

export default MCPTools;
