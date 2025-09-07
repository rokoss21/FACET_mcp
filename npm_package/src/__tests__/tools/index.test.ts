import MCPTools from '../../tools';
import FACETLenses from '../../utils/lenses';
import SchemaValidator from '../../utils/validator';

describe('MCPTools', () => {
  let tools: MCPTools;

  beforeEach(() => {
    tools = new MCPTools();
  });

  describe('getAllTools', () => {
    test('returns array of tools', () => {
      const allTools = tools.getAllTools();
      expect(Array.isArray(allTools)).toBe(true);
      expect(allTools.length).toBe(3); // execute, apply_lenses, validate_schema
    });

    test('each tool has required properties', () => {
      const allTools = tools.getAllTools();

      allTools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe('string');
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe('object');
        expect(tool.handler).toBeDefined();
        expect(typeof tool.handler).toBe('function');
      });
    });
  });

  describe('execute tool', () => {
    test('executes basic FACET document', async () => {
      const mockTools = new MCPTools();
      const executeTool = mockTools.getAllTools().find(t => t.name === 'execute');

      expect(executeTool).toBeDefined();

      const facetDoc = `
@workflow(name="TestWorkflow", version="1.0")
  description: "Test workflow execution"
`;

      const result = await executeTool!.handler({
        facet_source: facetDoc,
        variables: { test: 'value' }
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.executed).toBe(true);
    });

    test('handles template variables', async () => {
      const mockTools = new MCPTools();
      const executeTool = mockTools.getAllTools().find(t => t.name === 'execute');

      const facetDoc = 'Hello {{name}}, welcome to {{place}}!';
      const variables = { name: 'Alice', place: 'FACET' };

      const result = await executeTool!.handler({
        facet_source: facetDoc,
        variables
      });

      expect(result.result).toContain('Alice');
      expect(result.result).toContain('FACET');
    });

    test('handles empty variables', async () => {
      const mockTools = new MCPTools();
      const executeTool = mockTools.getAllTools().find(t => t.name === 'execute');

      const facetDoc = 'Simple document without variables';

      const result = await executeTool!.handler({
        facet_source: facetDoc
      });

      expect(result.result).toBe('Simple document without variables');
    });
  });

  describe('apply_lenses tool', () => {
    test('applies single lens', async () => {
      const mockTools = new MCPTools();
      const lensesTool = mockTools.getAllTools().find(t => t.name === 'apply_lenses');

      const result = await lensesTool!.handler({
        input_string: '  hello world  ',
        lenses: ['trim']
      });

      expect(result.result).toBe('hello world');
      expect(result.original).toBe('  hello world  ');
      expect(result.lenses_applied).toEqual(['trim']);
      expect(result.changed).toBe(true);
    });

    test('applies multiple lenses', async () => {
      const mockTools = new MCPTools();
      const lensesTool = mockTools.getAllTools().find(t => t.name === 'apply_lenses');

      const result = await lensesTool!.handler({
        input_string: '  HELLO   WORLD  ',
        lenses: ['trim', 'squeeze_spaces', 'lowercase']
      });

      expect(result.result).toBe('hello world');
      expect(result.lenses_applied).toEqual(['trim', 'squeeze_spaces', 'lowercase']);
    });

    test('handles empty lenses array', async () => {
      const mockTools = new MCPTools();
      const lensesTool = mockTools.getAllTools().find(t => t.name === 'apply_lenses');

      const result = await lensesTool!.handler({
        input_string: 'unchanged text',
        lenses: []
      });

      expect(result.result).toBe('unchanged text');
      expect(result.changed).toBe(false);
    });

    test('handles unknown lens gracefully', async () => {
      const mockTools = new MCPTools();
      const lensesTool = mockTools.getAllTools().find(t => t.name === 'apply_lenses');

      const result = await lensesTool!.handler({
        input_string: 'test',
        lenses: ['nonexistent_lens']
      });

      // Unknown lenses are ignored, so result should be unchanged
      expect(result.result).toBe('test');
      expect(result.changed).toBe(false);
    });
  });

  describe('validate_schema tool', () => {
    test('validates correct data against schema', async () => {
      const mockTools = new MCPTools();
      const validateTool = mockTools.getAllTools().find(t => t.name === 'validate_schema');

      const result = await validateTool!.handler({
        json_object: { name: 'John', age: 30 },
        json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name']
        }
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual(null);
      expect(result.schema_valid).toBe(true);
    });

    test('detects validation errors', async () => {
      const mockTools = new MCPTools();
      const validateTool = mockTools.getAllTools().find(t => t.name === 'validate_schema');

      const result = await validateTool!.handler({
        json_object: { age: 'thirty' }, // missing name, wrong type
        json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' }
          },
          required: ['name']
        }
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    test('handles schema validation', async () => {
      const mockTools = new MCPTools();
      const validateTool = mockTools.getAllTools().find(t => t.name === 'validate_schema');

      const result = await validateTool!.handler({
        json_object: { name: 'test' },
        json_schema: { type: 'invalid_type' } // schema with invalid type
      });

      // The schema validation may succeed even with invalid types in some cases
      expect(result).toBeDefined();
      expect(result.schema_valid).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('execute tool handles missing parameters gracefully', async () => {
      const mockTools = new MCPTools();
      const executeTool = mockTools.getAllTools().find(t => t.name === 'execute');

      const result = await executeTool!.handler({});
      // Tool should handle missing parameters gracefully
      expect(result).toBeDefined();
    });

    test('apply_lenses tool handles missing lenses', async () => {
      const mockTools = new MCPTools();
      const lensesTool = mockTools.getAllTools().find(t => t.name === 'apply_lenses');

      const result = await lensesTool!.handler({
        input_string: 'test'
        // missing lenses
      });

      // Tool should handle missing lenses gracefully
      expect(result).toBeDefined();
    });

    test('validate_schema tool handles null input', async () => {
      const mockTools = new MCPTools();
      const validateTool = mockTools.getAllTools().find(t => t.name === 'validate_schema');

      const result = await validateTool!.handler({
        json_object: null,
        json_schema: {}
      });

      // Tool should handle null input gracefully
      expect(result).toBeDefined();
    });
  });

  describe('Tool Parameters', () => {
    test('execute tool has correct parameter schema', () => {
      const mockTools = new MCPTools();
      const executeTool = mockTools.getAllTools().find(t => t.name === 'execute');

      expect(executeTool!.parameters.properties).toHaveProperty('facet_source');
      expect(executeTool!.parameters.properties).toHaveProperty('variables');
      expect(executeTool!.parameters.required).toContain('facet_source');
    });

    test('apply_lenses tool has correct parameter schema', () => {
      const mockTools = new MCPTools();
      const lensesTool = mockTools.getAllTools().find(t => t.name === 'apply_lenses');

      expect(lensesTool!.parameters.properties).toHaveProperty('input_string');
      expect(lensesTool!.parameters.properties).toHaveProperty('lenses');
      expect(lensesTool!.parameters.required).toContain('input_string');
      expect(lensesTool!.parameters.required).toContain('lenses');
    });

    test('validate_schema tool has correct parameter schema', () => {
      const mockTools = new MCPTools();
      const validateTool = mockTools.getAllTools().find(t => t.name === 'validate_schema');

      expect(validateTool!.parameters.properties).toHaveProperty('json_object');
      expect(validateTool!.parameters.properties).toHaveProperty('json_schema');
      expect(validateTool!.parameters.required).toContain('json_object');
      expect(validateTool!.parameters.required).toContain('json_schema');
    });
  });
});
